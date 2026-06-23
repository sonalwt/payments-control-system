/**
 * SoW §8.1 — generic PDF bank-statement parser.
 *
 * Bank statement PDFs have no machine-readable column structure: pdf-parse
 * yields a flat text layer in which the value-date and debit/credit/balance
 * cells of one row often appear in *different orders on different pages*. We
 * therefore cannot rely on token position to tell a debit from a credit from a
 * running balance.
 *
 * Instead we exploit the one invariant every statement honours — the running
 * balance forms a chain: each row's balance equals the previous row's balance
 * plus a credit or minus a debit. Anchored on the operator-entered opening and
 * closing balances, that chain lets us recover, for each row, which number is
 * the amount, which is the balance, and whether it was a debit or a credit —
 * independent of the order the bank's PDF happens to lay the cells out in.
 *
 * This is best-effort by design (multi-bank, no per-bank configuration): when
 * the chain cannot be reconciled for a row we fall back to narrative keywords
 * and record a warning so the operator can review the flagged upload.
 */
import pdfParse from 'pdf-parse';
import {
  ParsedStatementLine,
  StatementParseError,
  normaliseDate,
} from './statement-csv.parser';

/** Two halves of a cent — the tolerance for matching decimal money values. */
const EPS = 0.005;

export interface ParseStatementOptions {
  /** Operator-entered statement opening balance (anchors the oldest row). */
  openingBalance?: number | null;
  /** Operator-entered statement closing balance (anchors the newest row). */
  closingBalance?: number | null;
}

export interface PdfParseResult {
  lines: ParsedStatementLine[];
  /** Human-readable notes about anything uncertain; empty when fully confident. */
  warnings: string[];
}

/**
 * A monetary token: US-style grouped (`1,234,567.89`) or plain (`0.00`),
 * always with exactly two decimals. The trailing `(?!\d)` rejects 3-decimal
 * rates such as the `3.653` AED/USD rate that appears inside narratives.
 */
const MONEY_RE = /(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?!\d)/g;

/** A date token in any of the formats normaliseDate understands. */
const DATE_RE =
  /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/ ][A-Za-z]{3,9}[-/ ]\d{4})\b/;

interface Block {
  txnDate: string; // YYYY-MM-DD
  valueDate: string; // YYYY-MM-DD
  narrative: string;
  tokens: number[]; // parsed money values from the summary line, appearance order
  // Resolved during the chain solve:
  balance?: number | null;
  amount?: number | null;
  direction?: 'DEBIT' | 'CREDIT' | null;
}

function parseMoney(tok: string): number {
  return Number(tok.replace(/,/g, ''));
}

function moneyTokens(line: string): number[] {
  const out: number[] = [];
  for (const m of line.matchAll(MONEY_RE)) out.push(parseMoney(m[0]));
  return out;
}

function dateIn(line: string): string | null {
  const m = line.match(DATE_RE);
  return m ? normaliseDate(m[0].replace(/\s+/g, ' ').trim()) : null;
}

/** True when a line is nothing but a single date (a row's transaction date). */
function isDateOnly(line: string): boolean {
  if (moneyTokens(line).length > 0) return false;
  const d = dateIn(line);
  if (!d) return false;
  // The line must be (almost) entirely the date — no narrative riding along.
  const withoutDate = line.replace(DATE_RE, '').replace(/[^A-Za-z0-9]/g, '');
  return withoutDate.length === 0;
}

const NOISE_RE =
  /^(page\s*\d+\s*of\s*\d+|.*\bnarration\b.*\bdebit\b.*\bcredit\b.*|transaction\s*$|date\s*$)/i;

function tokenNear(tokens: number[], target: number): number | undefined {
  return tokens.find((t) => Math.abs(t - target) < EPS);
}

const CREDIT_HINTS =
  /\b(inward|credit|deposit|received|receipt|refund|reversal|cr)\b/i;
const DEBIT_HINTS =
  /\b(charge|charges|fee|tax|transfer|debit|withdrawal|payment|paid|ift|dr|purchase)\b/i;

function keywordDirection(narrative: string): 'DEBIT' | 'CREDIT' | null {
  // Credit wording is checked first: an "INWARD REMITTANCE" is a credit even
  // though "remittance"/"transfer"-style words elsewhere lean debit.
  if (CREDIT_HINTS.test(narrative)) return 'CREDIT';
  if (DEBIT_HINTS.test(narrative)) return 'DEBIT';
  return null;
}

/**
 * Pick the transaction amount from a row's money tokens given its (possibly
 * known) running balance. The amount is the non-zero token that is not the
 * balance; when the balance is unknown we take the smallest non-zero token,
 * since the balance is more often the larger figure (a heuristic — flagged by
 * the caller when relied upon).
 */
function pickAmount(tokens: number[], balance: number | null | undefined): number | null {
  const nonZero = tokens.filter((t) => Math.abs(t) > EPS);
  if (nonZero.length === 0) return null;
  if (balance != null) {
    const rest = nonZero.filter((t) => Math.abs(t - balance) >= EPS);
    if (rest.length) return rest.reduce((a, b) => (a <= b ? a : b));
    // Every non-zero token equals the balance (e.g. amount == balance): use it.
    return nonZero[0];
  }
  if (nonZero.length === 1) return nonZero[0];
  return nonZero.reduce((a, b) => (a <= b ? a : b));
}

/** Largest token — the running-balance fallback when the chain is broken. */
function largest(tokens: number[]): number | null {
  if (!tokens.length) return null;
  return tokens.reduce((a, b) => (a >= b ? a : b));
}

/**
 * Walk a newest-first ordered list of blocks, resolving each row's balance,
 * amount and direction from the running-balance chain. Mutates the blocks.
 * Returns the number of rows whose direction was settled by the chain (used to
 * score the orientation guess).
 */
function walkChain(
  blocks: Block[],
  closing: number | null | undefined,
  opening: number | null | undefined,
  warnings: string[],
): number {
  if (!blocks.length) return 0;
  let chained = 0;

  const first = blocks[0];
  first.balance =
    closing != null ? tokenNear(first.tokens, closing) ?? closing : largest(first.tokens);

  for (let i = 0; i < blocks.length; i++) {
    const blk = blocks[i];
    const next = blocks[i + 1];
    const bal = blk.balance ?? null;
    const amount = pickAmount(blk.tokens, bal);
    blk.amount = amount;

    let dir: 'DEBIT' | 'CREDIT' | null = null;
    if (bal != null && amount != null) {
      const creditBal = bal - amount; // older balance had this been a credit
      const debitBal = bal + amount; // older balance had this been a debit
      if (next) {
        const c = tokenNear(next.tokens, creditBal);
        const d = tokenNear(next.tokens, debitBal);
        if (c != null) {
          dir = 'CREDIT';
          next.balance = c;
        } else if (d != null) {
          dir = 'DEBIT';
          next.balance = d;
        }
      } else if (opening != null) {
        // Oldest row: the chain must land on the opening balance.
        if (Math.abs(creditBal - opening) < EPS) dir = 'CREDIT';
        else if (Math.abs(debitBal - opening) < EPS) dir = 'DEBIT';
      }
    }

    if (dir != null) {
      chained++;
    } else {
      dir = keywordDirection(blk.narrative) ?? 'DEBIT';
      if (next && next.balance == null) next.balance = largest(next.tokens);
    }
    blk.direction = dir;
  }
  return chained;
}

/**
 * Resolve all blocks. Auto-detects newest-first vs oldest-first ordering by
 * which end the closing balance anchors to (falling back to the orientation
 * that the chain reconciles best).
 */
function solve(
  blocks: Block[],
  opts: ParseStatementOptions,
  warnings: string[],
): void {
  if (blocks.length < 2) {
    walkChain(blocks, opts.closingBalance, opts.openingBalance, warnings);
    return;
  }
  const closing = opts.closingBalance ?? null;
  const opening = opts.openingBalance ?? null;

  const startHasClosing = closing != null && tokenNear(blocks[0].tokens, closing) != null;
  const endHasClosing =
    closing != null && tokenNear(blocks[blocks.length - 1].tokens, closing) != null;

  if (endHasClosing && !startHasClosing) {
    // Oldest-first statement: walk a reversed (newest-first) view.
    const view = [...blocks].reverse();
    walkChain(view, closing, opening, warnings);
    return;
  }
  if (startHasClosing) {
    walkChain(blocks, closing, opening, warnings);
    return;
  }

  // Anchor ambiguous: try both orientations and keep whichever chains more rows.
  const forward = blocks.map((b) => ({ ...b }));
  const fScore = walkChain(forward, closing, opening, []);
  const reverse = [...blocks].reverse().map((b) => ({ ...b }));
  const rScore = walkChain(reverse, closing, opening, []);
  if (rScore > fScore) {
    const view = [...blocks].reverse();
    walkChain(view, closing, opening, warnings);
  } else {
    walkChain(blocks, closing, opening, warnings);
  }
  if (closing != null) {
    warnings.push(
      'Closing balance did not match the first or last statement row; row directions were inferred from the balance chain and narratives.',
    );
  }
}

/**
 * Group the statement text into transaction blocks. A row opens on a date-only
 * line (its transaction date) and closes on the first line carrying two or more
 * money tokens (the debit/credit/balance summary). Banks that print the whole
 * row on one line are handled too: a money line seen with no row open becomes a
 * one-line transaction.
 */
function buildBlocks(text: string): Block[] {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !NOISE_RE.test(l));

  const blocks: Block[] = [];
  let open: { txnDate: string; narrative: string[] } | null = null;

  const closeWith = (summary: string) => {
    const tokens = moneyTokens(summary);
    const vDate = dateIn(summary);
    const txnDate = open?.txnDate ?? vDate;
    if (!txnDate) return; // no date anywhere — not a real row
    blocks.push({
      txnDate,
      valueDate: vDate ?? txnDate,
      narrative: (open?.narrative ?? []).join(' ').replace(/\s+/g, ' ').trim(),
      tokens,
    });
    open = null;
  };

  for (const line of lines) {
    const tokens = moneyTokens(line);
    if (isDateOnly(line)) {
      // A new transaction date. If a row was open without a summary, drop it.
      open = { txnDate: dateIn(line) as string, narrative: [] };
      continue;
    }
    if (tokens.length >= 2) {
      // Summary line for the open row (or a self-contained one-line row).
      closeWith(line);
      continue;
    }
    // Narrative (including lines bearing a single inline amount).
    if (open) open.narrative.push(line);
  }
  return blocks;
}

/** Parse already-extracted statement text. Pure and unit-testable. */
export function parseStatementText(
  text: string,
  opts: ParseStatementOptions = {},
): PdfParseResult {
  const warnings: string[] = [];
  const blocks = buildBlocks(text);
  if (blocks.length === 0) {
    throw new StatementParseError(
      'No transaction rows could be read from this PDF. It may be a scanned image, or use a layout this parser does not recognise.',
    );
  }

  solve(blocks, opts, warnings);

  const lines: ParsedStatementLine[] = [];
  let skipped = 0;
  for (const blk of blocks) {
    if (blk.amount == null || !(blk.amount > 0) || !blk.direction) {
      skipped++;
      continue;
    }
    lines.push({
      valueDate: blk.valueDate,
      postingDate: blk.txnDate !== blk.valueDate ? blk.txnDate : null,
      direction: blk.direction,
      amount: blk.amount.toFixed(4),
      bankReference: null,
      counterpartyText: null,
      narrative: blk.narrative || null,
      runningBalance: blk.balance != null ? String(blk.balance) : null,
    });
  }

  if (lines.length === 0) {
    throw new StatementParseError(
      'Transaction rows were detected but no usable amounts could be read from this PDF. Please verify the file or enter the statement manually.',
    );
  }
  if (skipped > 0) {
    warnings.push(`${skipped} detected row(s) were skipped because no amount could be read.`);
  }

  // Cross-check the resolved chain against the operator-entered balances.
  if (opts.closingBalance != null || opts.openingBalance != null) {
    const withBal = blocks.filter((b) => b.balance != null);
    if (withBal.length >= 2) {
      const newest = withBal[0].balance as number;
      const oldest = withBal[withBal.length - 1].balance as number;
      const ends = [newest, oldest];
      if (
        opts.closingBalance != null &&
        !ends.some((e) => Math.abs(e - (opts.closingBalance as number)) < 1)
      ) {
        warnings.push(
          'The reconstructed running balance does not match the entered closing balance — review the parsed rows.',
        );
      }
    }
  }

  return { lines, warnings };
}

/**
 * Extract the text layer from a statement PDF and parse it. Throws
 * StatementParseError for non-text (scanned) PDFs or unreadable layouts so the
 * caller can mark the upload as failed.
 */
export async function parseStatementPdf(
  buffer: Buffer,
  opts: ParseStatementOptions = {},
): Promise<PdfParseResult> {
  // pdf-parse (bundled pdf.js) has a cold-start quirk: the first couple of
  // parses after the worker is cold throw a spurious "bad XRef entry" /
  // "Invalid PDF structure" on perfectly valid PDFs, then succeed on retry.
  // Without this, the first statement upload(s) after a server start fail. Retry
  // a few times before surfacing the error so a valid PDF parses on attempt 1.
  let text: string | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const parsed = await pdfParse(buffer);
      text = parsed.text ?? '';
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr !== null || text === null) {
    throw new StatementParseError(
      `Could not read this PDF: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
    );
  }
  if (text.replace(/\s+/g, '').length < 40) {
    throw new StatementParseError(
      'This PDF has no readable text layer (it looks like a scanned image). OCR is required, or enter the statement manually.',
    );
  }
  return parseStatementText(text, opts);
}
