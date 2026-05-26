import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { CsvColumnMappingDto } from './dto/ingest.dto';

export interface ParsedStatementLine {
  lineIndex: number;
  valueDate: string;
  postingDate: string | null;
  direction: 'DEBIT' | 'CREDIT';
  amount: string;
  bankReference: string | null;
  counterpartyText: string | null;
  narrative: string | null;
  runningBalance: string | null;
  rawRow: Record<string, string>;
}

/**
 * Header aliases tried when the caller does not pass an explicit mapping.
 * Match is case-insensitive and tolerant of common variations.
 */
const HEADER_ALIASES: Record<string, string[]> = {
  valueDate: ['value date', 'value_date', 'valuedate', 'val date', 'date'],
  postingDate: ['posting date', 'posted date', 'transaction date', 'txn date', 'posting_date'],
  description: ['description', 'narrative', 'particulars', 'details', 'remarks', 'narration'],
  debit: ['debit', 'debit amount', 'withdrawal', 'paid out', 'dr amount'],
  credit: ['credit', 'credit amount', 'deposit', 'paid in', 'cr amount'],
  signedAmount: ['amount', 'signed amount', 'transaction amount', 'txn amount'],
  reference: ['reference', 'ref', 'bank reference', 'utr', 'transaction id', 'txn ref', 'reference no'],
  counterparty: ['counterparty', 'beneficiary', 'payee', 'remitter', 'payer'],
  balance: ['balance', 'running balance', 'closing balance', 'bal'],
  directionColumn: ['direction', 'dr/cr', 'type', 'txn type'],
};

interface ResolvedMapping {
  valueDate: string;
  postingDate: string | null;
  description: string | null;
  debit: string | null;
  credit: string | null;
  signedAmount: string | null;
  reference: string | null;
  counterparty: string | null;
  balance: string | null;
  directionColumn: string | null;
}

@Injectable()
export class StatementCsvParser {
  parse(buffer: Buffer, mapping?: CsvColumnMappingDto): ParsedStatementLine[] {
    let rows: Array<Record<string, string>>;
    try {
      rows = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        bom: true,
      }) as Array<Record<string, string>>;
    } catch (err) {
      throw new BadRequestException(
        `Statement CSV could not be parsed: ${(err as Error).message}`,
      );
    }

    if (rows.length === 0) {
      throw new BadRequestException('Statement CSV contains no data rows.');
    }

    const headers = Object.keys(rows[0]);
    const resolved = this.resolveMapping(headers, mapping);

    const out: ParsedStatementLine[] = [];
    rows.forEach((row, idx) => {
      const line = this.parseRow(row, resolved, idx + 1);
      if (line) out.push(line);
    });

    if (out.length === 0) {
      throw new BadRequestException(
        'No statement lines were extracted from the CSV. Verify the column mapping and that each row carries an amount.',
      );
    }

    return out;
  }

  // -------------------------------------------------------------------

  private resolveMapping(
    headers: string[],
    explicit?: CsvColumnMappingDto,
  ): ResolvedMapping {
    const lower = headers.map((h) => h.toLowerCase().trim());

    const find = (aliases: string[]): string | null => {
      for (const a of aliases) {
        const i = lower.indexOf(a.toLowerCase());
        if (i >= 0) return headers[i];
      }
      for (const a of aliases) {
        const i = lower.findIndex((h) => h.includes(a.toLowerCase()));
        if (i >= 0) return headers[i];
      }
      return null;
    };

    const pick = (
      explicitField: string | undefined,
      aliasKey: keyof typeof HEADER_ALIASES,
    ): string | null => {
      if (explicitField && headers.includes(explicitField)) return explicitField;
      return find(HEADER_ALIASES[aliasKey]);
    };

    const valueDate = pick(explicit?.valueDate, 'valueDate');
    if (!valueDate) {
      throw new BadRequestException(
        `Could not locate a value-date column. Headers found: ${headers.join(', ')}.`,
      );
    }

    const signedAmount = pick(explicit?.signedAmount, 'signedAmount');
    const debit = pick(explicit?.debit, 'debit');
    const credit = pick(explicit?.credit, 'credit');
    if (!signedAmount && !debit && !credit) {
      throw new BadRequestException(
        'CSV needs either a signed-amount column or a debit/credit pair to determine direction.',
      );
    }

    return {
      valueDate,
      postingDate: pick(explicit?.postingDate, 'postingDate'),
      description: pick(explicit?.description, 'description'),
      debit,
      credit,
      signedAmount,
      reference: pick(explicit?.reference, 'reference'),
      counterparty: pick(explicit?.counterparty, 'counterparty'),
      balance: pick(explicit?.balance, 'balance'),
      directionColumn: pick(explicit?.directionColumn, 'directionColumn'),
    };
  }

  private parseRow(
    row: Record<string, string>,
    map: ResolvedMapping,
    lineIndex: number,
  ): ParsedStatementLine | null {
    const valueDate = this.parseDate(row[map.valueDate]);
    if (!valueDate) return null;

    let direction: 'DEBIT' | 'CREDIT' | null = null;
    let amount: number | null = null;

    if (map.signedAmount) {
      const n = this.parseNumber(row[map.signedAmount]);
      if (n === null || n === 0) return null;
      direction = n < 0 ? 'DEBIT' : 'CREDIT';
      amount = Math.abs(n);
    } else {
      const debitVal = map.debit ? this.parseNumber(row[map.debit]) : null;
      const creditVal = map.credit ? this.parseNumber(row[map.credit]) : null;
      if (debitVal && debitVal > 0) {
        direction = 'DEBIT';
        amount = debitVal;
      } else if (creditVal && creditVal > 0) {
        direction = 'CREDIT';
        amount = creditVal;
      }
    }

    if (map.directionColumn) {
      const dir = (row[map.directionColumn] ?? '').toLowerCase().trim();
      if (dir.startsWith('dr') || dir === 'debit' || dir === 'withdrawal') direction = 'DEBIT';
      if (dir.startsWith('cr') || dir === 'credit' || dir === 'deposit') direction = 'CREDIT';
    }

    if (!direction || amount === null || amount <= 0) return null;

    return {
      lineIndex,
      valueDate,
      postingDate: map.postingDate ? this.parseDate(row[map.postingDate]) : null,
      direction,
      amount: amount.toFixed(4),
      bankReference: map.reference ? row[map.reference] || null : null,
      counterpartyText: map.counterparty ? row[map.counterparty] || null : null,
      narrative: map.description ? row[map.description] || null : null,
      runningBalance: map.balance
        ? (this.parseNumber(row[map.balance])?.toFixed(4) ?? null)
        : null,
      rawRow: row,
    };
  }

  private parseNumber(raw: string | undefined): number | null {
    if (!raw) return null;
    let s = raw.trim().replace(/[,\s]/g, '');
    let sign = 1;
    if (s.startsWith('(') && s.endsWith(')')) {
      sign = -1;
      s = s.slice(1, -1);
    }
    s = s.replace(/[^0-9.+\-eE]/g, '');
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return n * sign;
  }

  /** Accepts ISO (YYYY-MM-DD), DD/MM/YYYY, MM/DD/YYYY, DD-MMM-YYYY. */
  private parseDate(raw: string | undefined): string | null {
    if (!raw) return null;
    const s = raw.trim();
    if (!s) return null;

    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

    const slash = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (slash) {
      const a = parseInt(slash[1], 10);
      const b = parseInt(slash[2], 10);
      let y = parseInt(slash[3], 10);
      if (y < 100) y += 2000;
      let day: number;
      let month: number;
      if (a > 12) {
        day = a;
        month = b;
      } else if (b > 12) {
        month = a;
        day = b;
      } else {
        day = a;
        month = b;
      }
      return `${y.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const mon = s.match(/^(\d{1,2})[\-\s]([A-Za-z]{3,})[\-\s](\d{2,4})/);
    if (mon) {
      const day = parseInt(mon[1], 10);
      const months: Record<string, number> = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
      };
      const month = months[mon[2].toLowerCase().slice(0, 3)];
      if (!month) return null;
      let y = parseInt(mon[3], 10);
      if (y < 100) y += 2000;
      return `${y.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  }
}
