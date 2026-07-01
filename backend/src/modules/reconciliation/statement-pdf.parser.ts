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

/** Minimum non-whitespace chars for a text layer to be treated as usable. */
const MIN_TEXT_CHARS = 40;

const collapsed = (s: string): number => s.replace(/\s+/g, '').length;

/**
 * Recovery extractor built on modern pdfjs-dist (the legacy/CommonJS build).
 * The pdf.js bundled inside pdf-parse is from ~2017 and throws "bad XRef entry"
 * on statements whose cross-reference table is malformed (some bank generators,
 * e.g. Emirates NBD businessONLINE, emit these). Current pdf.js instead rebuilds
 * a broken xref table by scanning the file, so it opens those statements.
 *
 * pdfjs yields individually-positioned text items rather than lines, so we group
 * items by their y coordinate (top-to-bottom) and order each line left-to-right,
 * reproducing the newline-delimited layout buildBlocks() expects.
 */
async function extractTextWithPdfjs(buffer: Buffer): Promise<string> {
  // Lazy-require: the heavy pdfjs module (and its node DOMMatrix-polyfill
  // warnings) only loads on the rare fallback path, never at app boot.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

  let standardFontDataUrl: string | undefined;
  try {
    // Point pdfjs at its bundled standard fonts so it doesn't warn while
    // mapping common fonts (forward slashes work on every platform).
    standardFontDataUrl = require
      .resolve('pdfjs-dist/package.json')
      .replace(/\\/g, '/')
      .replace(/package\.json$/, 'standard_fonts/');
  } catch {
    standardFontDataUrl = undefined;
  }

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    verbosity: 0, // errors only — silence font/eval informational warnings
    standardFontDataUrl,
  }).promise;

  const Y_TOL = 2.5; // points: items within this y-distance share a line
  let out = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const rows: { y: number; items: { x: number; str: string }[] }[] = [];
    for (const it of content.items as Array<{ str?: string; transform: number[] }>) {
      if (!it.str) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      let row = rows.find((r) => Math.abs(r.y - y) <= Y_TOL);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ x, str: it.str });
    }
    rows.sort((a, b) => b.y - a.y); // top of page first
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      out += r.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim() + '\n';
    }
  }
  return out;
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
  // Primary: pdf-parse. It reconstructs the newline-delimited text layer the
  // block parser is tuned for. It also has a cold-start quirk — the first
  // parse(s) after the worker is cold can throw a spurious "bad XRef entry" on
  // valid PDFs — so retry a few times before falling back.
  let text: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const parsed = await pdfParse(buffer);
      const t = parsed.text ?? '';
      if (collapsed(t) >= MIN_TEXT_CHARS) {
        text = t;
        break;
      }
      // Opened but (near-)empty — a scanned image, or a layout/xref pdf-parse
      // can't map. Stop retrying; let the pdfjs fallback attempt recovery.
      break;
    } catch {
      // Genuine parse failure (e.g. a malformed xref pdf-parse can't rebuild).
      // Retry for the cold-start case, then fall back to pdfjs below.
    }
  }

  // Fallback: modern pdfjs-dist, which recovers PDFs pdf-parse cannot open
  // (notably "bad XRef entry") or returned no text for.
  if (text === null) {
    try {
      const recovered = await extractTextWithPdfjs(buffer);
      if (collapsed(recovered) >= MIN_TEXT_CHARS) text = recovered;
    } catch {
      // fall through to the error below
    }
  }

  if (text === null) {
    throw new StatementParseError(
      'This PDF could not be read — it may be a scanned image (OCR required) or use a layout this parser does not recognise. Please verify the file or enter the statement manually.',
    );
  }

  return parseStatementText(text, opts);
}
