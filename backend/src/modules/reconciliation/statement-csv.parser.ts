/**
 * SoW §8.1 — CSV statement parser with a flexible, header-driven column
 * mapping. Real deployments configure a per-bank column map; this parser
 * auto-detects the common shapes (separate debit/credit columns, or a single
 * signed amount column) so uploaded CSV exports can be reconciled without
 * bespoke configuration.
 */

export interface ParsedStatementLine {
  valueDate: string; // YYYY-MM-DD
  postingDate?: string | null;
  direction: 'DEBIT' | 'CREDIT';
  amount: string; // positive decimal string
  bankReference?: string | null;
  counterpartyText?: string | null;
  narrative?: string | null;
  runningBalance?: string | null;
}

export class StatementParseError extends Error {}

/** Split one CSV line into fields, honouring double-quoted values. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Normalise a header cell to a comparable token. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findIndex(headers: string[], candidates: string[]): number {
  const normalised = headers.map(norm);
  for (const c of candidates) {
    const idx = normalised.indexOf(norm(c));
    if (idx !== -1) return idx;
  }
  // Fall back to a contains match.
  for (let i = 0; i < normalised.length; i++) {
    if (candidates.some((c) => normalised[i].includes(norm(c)))) return i;
  }
  return -1;
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/** Normalise a date cell to YYYY-MM-DD; returns null when unparseable. */
export function normaliseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  // YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  // DD/MM/YYYY or DD-MM-YYYY (day-first, the common non-US bank format)
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  // DD-MMM-YYYY (e.g. 08-Jun-2026)
  m = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[A-Za-z]*[-/ ](\d{4})$/);
  if (m) {
    const mon = MONTHS[m[2].toLowerCase()];
    if (mon) return `${m[3]}-${mon}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.\-()]/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '()') return null;
  // Accounting negative: (1,234.56)
  const negative = /^\(.*\)$/.test(cleaned);
  const num = Number(cleaned.replace(/[()]/g, ''));
  if (!Number.isFinite(num)) return null;
  return negative ? -Math.abs(num) : num;
}

export function parseStatementCsv(content: string): ParsedStatementLine[] {
  const rows = content
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (rows.length < 2) {
    throw new StatementParseError(
      'The statement file has no data rows (a header row plus at least one entry is required).',
    );
  }

  const headers = splitCsvLine(rows[0]);
  const valueDateIdx = findIndex(headers, ['value date', 'valuedate', 'date', 'transaction date', 'txn date']);
  const postingDateIdx = findIndex(headers, ['posting date', 'postingdate', 'booking date']);
  const debitIdx = findIndex(headers, ['debit', 'withdrawal', 'dr', 'paid out']);
  const creditIdx = findIndex(headers, ['credit', 'deposit', 'cr', 'paid in']);
  const amountIdx = findIndex(headers, ['amount', 'value']);
  const refIdx = findIndex(headers, ['reference', 'ref', 'utr', 'cheque', 'transaction id', 'txn id']);
  const counterpartyIdx = findIndex(headers, ['counterparty', 'payee', 'beneficiary', 'remitter', 'party']);
  const narrativeIdx = findIndex(headers, ['narrative', 'description', 'details', 'particulars', 'remarks']);
  const balanceIdx = findIndex(headers, ['balance', 'running balance', 'closing balance']);

  if (valueDateIdx === -1) {
    throw new StatementParseError(
      'Could not find a date column. Expected a header such as "Value Date", "Date" or "Transaction Date".',
    );
  }
  if (debitIdx === -1 && creditIdx === -1 && amountIdx === -1) {
    throw new StatementParseError(
      'Could not find an amount column. Expected "Debit"/"Credit" columns or a single "Amount" column.',
    );
  }

  const lines: ParsedStatementLine[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = splitCsvLine(rows[i]);
    const get = (idx: number): string => (idx >= 0 && idx < cells.length ? cells[idx] : '');

    const valueDate = normaliseDate(get(valueDateIdx));
    if (!valueDate) continue; // skip non-data rows (totals, blanks)

    let direction: 'DEBIT' | 'CREDIT' | null = null;
    let amount: number | null = null;

    if (debitIdx !== -1 || creditIdx !== -1) {
      const debit = parseAmount(get(debitIdx));
      const credit = parseAmount(get(creditIdx));
      if (debit && debit !== 0) {
        direction = 'DEBIT';
        amount = Math.abs(debit);
      } else if (credit && credit !== 0) {
        direction = 'CREDIT';
        amount = Math.abs(credit);
      }
    }
    if (amount === null && amountIdx !== -1) {
      const signed = parseAmount(get(amountIdx));
      if (signed !== null && signed !== 0) {
        direction = signed < 0 ? 'DEBIT' : 'CREDIT';
        amount = Math.abs(signed);
      }
    }
    if (direction === null || amount === null) continue; // zero / unparseable amount

    lines.push({
      valueDate,
      postingDate: postingDateIdx !== -1 ? normaliseDate(get(postingDateIdx)) : null,
      direction,
      amount: amount.toFixed(4),
      bankReference: refIdx !== -1 ? get(refIdx) || null : null,
      counterpartyText: counterpartyIdx !== -1 ? get(counterpartyIdx) || null : null,
      narrative: narrativeIdx !== -1 ? get(narrativeIdx) || null : null,
      runningBalance:
        balanceIdx !== -1 && parseAmount(get(balanceIdx)) !== null
          ? String(parseAmount(get(balanceIdx)))
          : null,
    });
  }

  if (lines.length === 0) {
    throw new StatementParseError(
      'No valid statement entries were found. Check the date and amount columns.',
    );
  }
  return lines;
}
