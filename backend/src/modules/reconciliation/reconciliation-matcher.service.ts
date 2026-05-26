import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  StatementLine,
  StatementLineMatchStatus,
} from './statement-line.entity';
import { StatementUpload } from '../statement-uploads/statement-upload.entity';
import { ReconciliationException } from './reconciliation-exception.entity';

interface PrCandidate {
  id: string;
  request_number: string;
  amount: string;
  bank_reference: string | null;
  paid_at: Date;
  counterparty_name: string | null;
  beneficiary_holder_name: string | null;
}

interface IrCandidate {
  id: string;
  receipt_number: string;
  received_amount: string | null;
  expected_amount: string;
  inward_bank_reference: string | null;
  received_at: Date | null;
  counterparty_name: string | null;
}

interface MatchOutcome {
  status: StatementLineMatchStatus;
  paymentRequestId?: string | null;
  incomingReceiptId?: string | null;
  score?: number;
  reason: string;
}

/**
 * SOW §8.2 — Auto-matching engine.
 *
 * Per line:
 *   debit  → PAID payment_requests on same source account, ±5d window.
 *   credit → RECEIVED incoming_receipts on same receive-from account, ±5d.
 *
 * Outcome rules:
 *   - exact amount + bank reference match → MATCHED.
 *   - unique amount-on-account hit with name confirmation → MATCHED.
 *   - unique amount-on-account hit without name confirmation → CANDIDATE.
 *   - multiple amount hits, one name-confirmed → CANDIDATE.
 *   - else → EXCEPTION.
 *
 * The matcher is read-only against the source domain — it never mutates
 * payment_requests or incoming_receipts. Only statement_lines,
 * reconciliation_exceptions, and statement_uploads counters are touched.
 */
@Injectable()
export class ReconciliationMatcherService {
  private readonly MATCH_WINDOW_DAYS = 5;

  constructor(
    @InjectRepository(StatementLine)
    private readonly lineRepo: Repository<StatementLine>,
    @InjectRepository(StatementUpload)
    private readonly uploadRepo: Repository<StatementUpload>,
    @InjectRepository(ReconciliationException)
    private readonly exceptionRepo: Repository<ReconciliationException>,
    private readonly dataSource: DataSource,
  ) {}

  /** Run the matcher across every line on the given upload. Idempotent. */
  async runForUpload(uploadId: string): Promise<{
    matched: number;
    candidate: number;
    exception: number;
  }> {
    const lines = await this.lineRepo.find({
      where: { statementUploadId: uploadId },
      order: { lineIndex: 'ASC' },
    });

    let matched = 0;
    let candidate = 0;
    let exception = 0;

    for (const line of lines) {
      if (line.matchStatus === 'MATCHED') {
        matched++;
        continue;
      }
      const outcome =
        line.direction === 'DEBIT'
          ? await this.matchDebit(line)
          : await this.matchCredit(line);
      await this.applyOutcome(line, outcome);
      if (outcome.status === 'MATCHED') matched++;
      else if (outcome.status === 'CANDIDATE') candidate++;
      else exception++;
    }

    await this.uploadRepo.update(uploadId, {
      ingestionStatus: 'MATCHED',
      autoMatchCompletedAt: new Date(),
      matchedCount: matched,
      candidateCount: candidate,
      exceptionCount: exception,
    });

    return { matched, candidate, exception };
  }

  /** §8.2 — human confirmation of a candidate line. Closes any
   *  open exception generated previously for the same line. */
  async confirmCandidate(
    line: StatementLine,
    userId: string,
    target: { paymentRequestId?: string | null; incomingReceiptId?: string | null },
    note?: string,
  ): Promise<StatementLine> {
    const paymentRequestId = target.paymentRequestId ?? line.matchedPaymentRequestId ?? null;
    const incomingReceiptId = target.incomingReceiptId ?? line.matchedIncomingReceiptId ?? null;

    line.matchStatus = 'MATCHED';
    line.matchedPaymentRequestId = paymentRequestId;
    line.matchedIncomingReceiptId = incomingReceiptId;
    line.matchedAt = new Date();
    line.matchedBy = userId;
    if (note) {
      line.matchReason = `${line.matchReason ?? ''} | Confirmed: ${note}`;
    }

    if (line.exceptionId) {
      await this.exceptionRepo.update(line.exceptionId, {
        status: 'RESOLVED_WITH_JUSTIFICATION',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote: `Resolved by confirming candidate match. ${note ?? ''}`.trim(),
      });
      line.exceptionId = null;
    }
    const saved = await this.lineRepo.save(line);
    await this.recountUpload(line.statementUploadId);
    return saved;
  }

  /** Unlink any match and route the line to an exception. */
  async unmatch(line: StatementLine, reason: string, userId: string): Promise<StatementLine> {
    line.matchedPaymentRequestId = null;
    line.matchedIncomingReceiptId = null;
    line.matchScore = null;
    line.matchReason = `Unmatched by user: ${reason}`;
    line.matchedAt = null;
    line.matchedBy = userId;
    line.matchStatus = 'EXCEPTION';

    const exception = await this.createException(line);
    line.exceptionId = exception.id;
    const saved = await this.lineRepo.save(line);
    await this.recountUpload(line.statementUploadId);
    return saved;
  }

  /** Called by the exceptions module after a status change to keep the
   *  parent upload's exception_count in sync. */
  async recountUpload(uploadId: string): Promise<void> {
    const rows = await this.dataSource.query<
      Array<{ matched: string; candidate: string; exception: string }>
    >(
      `
      SELECT
        COUNT(*) FILTER (WHERE match_status = 'MATCHED')   AS matched,
        COUNT(*) FILTER (WHERE match_status = 'CANDIDATE') AS candidate,
        COUNT(*) FILTER (WHERE match_status = 'EXCEPTION') AS exception
      FROM statement_lines
      WHERE statement_upload_id = $1
      `,
      [uploadId],
    );
    const r = rows[0];
    await this.uploadRepo.update(uploadId, {
      matchedCount: Number(r.matched),
      candidateCount: Number(r.candidate),
      exceptionCount: Number(r.exception),
    });
  }

  // -------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------

  private async matchDebit(line: StatementLine): Promise<MatchOutcome> {
    const candidates = await this.findPrCandidates(line);
    if (candidates.length === 0) {
      return {
        status: 'EXCEPTION',
        reason: 'No PAID payment request on this account within the matching window.',
      };
    }

    const exactRef = line.bankReference
      ? candidates.find(
          (c) =>
            c.bank_reference != null &&
            c.bank_reference.trim().toLowerCase() ===
              line.bankReference!.trim().toLowerCase(),
        )
      : undefined;
    if (exactRef && this.amountsEqual(exactRef.amount, line.amount)) {
      return {
        status: 'MATCHED',
        paymentRequestId: exactRef.id,
        score: 1.0,
        reason: `Exact match on amount and bank reference (${exactRef.bank_reference}).`,
      };
    }

    const amountHits = candidates.filter((c) => this.amountsEqual(c.amount, line.amount));
    if (amountHits.length === 1) {
      const c = amountHits[0];
      const nameHit = this.nameLooksLike(
        line.counterpartyText,
        c.counterparty_name,
        c.beneficiary_holder_name,
      );
      return {
        status: nameHit ? 'MATCHED' : 'CANDIDATE',
        paymentRequestId: c.id,
        score: nameHit ? 0.95 : 0.7,
        reason: nameHit
          ? `Unique amount match on this account; beneficiary name confirmed (${c.request_number}).`
          : `Unique amount match on this account (${c.request_number}); name not verified.`,
      };
    }
    if (amountHits.length > 1) {
      const named = amountHits.find((c) =>
        this.nameLooksLike(line.counterpartyText, c.counterparty_name, c.beneficiary_holder_name),
      );
      if (named) {
        return {
          status: 'CANDIDATE',
          paymentRequestId: named.id,
          score: 0.6,
          reason: `Multiple amount matches; selected by beneficiary name (${named.request_number}).`,
        };
      }
    }

    return {
      status: 'EXCEPTION',
      reason: `No confident match among ${candidates.length} PAID candidate(s).`,
    };
  }

  private async matchCredit(line: StatementLine): Promise<MatchOutcome> {
    const candidates = await this.findIrCandidates(line);
    if (candidates.length === 0) {
      return {
        status: 'EXCEPTION',
        reason: 'No RECEIVED incoming receipt on this account within the matching window.',
      };
    }

    const exactRef = line.bankReference
      ? candidates.find(
          (c) =>
            c.inward_bank_reference != null &&
            c.inward_bank_reference.trim().toLowerCase() ===
              line.bankReference!.trim().toLowerCase(),
        )
      : undefined;
    if (exactRef) {
      const amt = exactRef.received_amount ?? exactRef.expected_amount;
      if (this.amountsEqual(amt, line.amount)) {
        return {
          status: 'MATCHED',
          incomingReceiptId: exactRef.id,
          score: 1.0,
          reason: `Exact match on amount and inward bank reference (${exactRef.inward_bank_reference}).`,
        };
      }
    }

    const amountHits = candidates.filter((c) => {
      const amt = c.received_amount ?? c.expected_amount;
      return this.amountsEqual(amt, line.amount);
    });
    if (amountHits.length === 1) {
      const c = amountHits[0];
      const nameHit = this.nameLooksLike(line.counterpartyText, c.counterparty_name, null);
      return {
        status: nameHit ? 'MATCHED' : 'CANDIDATE',
        incomingReceiptId: c.id,
        score: nameHit ? 0.95 : 0.7,
        reason: nameHit
          ? `Unique amount match; counterparty name confirmed (${c.receipt_number}).`
          : `Unique amount match (${c.receipt_number}); name not verified.`,
      };
    }
    if (amountHits.length > 1) {
      const named = amountHits.find((c) =>
        this.nameLooksLike(line.counterpartyText, c.counterparty_name, null),
      );
      if (named) {
        return {
          status: 'CANDIDATE',
          incomingReceiptId: named.id,
          score: 0.6,
          reason: `Multiple amount matches; selected by counterparty name (${named.receipt_number}).`,
        };
      }
    }

    return {
      status: 'EXCEPTION',
      reason: `No confident match among ${candidates.length} RECEIVED candidate(s).`,
    };
  }

  private findPrCandidates(line: StatementLine): Promise<PrCandidate[]> {
    return this.dataSource.query<PrCandidate[]>(
      `
      SELECT pr.id,
             pr.request_number,
             pr.amount::text          AS amount,
             pr.bank_reference,
             pr.paid_at,
             cp.name                  AS counterparty_name,
             ba.account_holder_name   AS beneficiary_holder_name
        FROM payment_requests pr
        LEFT JOIN counterparties cp ON cp.id = pr.counterparty_id
        LEFT JOIN beneficiary_accounts ba ON ba.id = pr.beneficiary_account_id
       WHERE pr.source_account_id = $1
         AND pr.status            = 'PAID'
         AND pr.deleted_at IS NULL
         AND (pr.paid_at::date BETWEEN ($2::date - $3::int) AND ($2::date + $3::int))
       ORDER BY pr.paid_at DESC
      `,
      [line.bankAccountId, line.valueDate, this.MATCH_WINDOW_DAYS],
    );
  }

  private findIrCandidates(line: StatementLine): Promise<IrCandidate[]> {
    return this.dataSource.query<IrCandidate[]>(
      `
      SELECT ir.id,
             ir.receipt_number,
             COALESCE(ir.received_amount::text, NULL) AS received_amount,
             ir.expected_amount::text                  AS expected_amount,
             ir.inward_bank_reference,
             ir.received_at,
             cp.name AS counterparty_name
        FROM incoming_receipts ir
        LEFT JOIN counterparties cp ON cp.id = ir.counterparty_id
       WHERE ir.receive_from_account_id = $1
         AND ir.status                  = 'RECEIVED'
         AND ir.deleted_at IS NULL
         AND (ir.received_at::date BETWEEN ($2::date - $3::int) AND ($2::date + $3::int))
       ORDER BY ir.received_at DESC
      `,
      [line.bankAccountId, line.valueDate, this.MATCH_WINDOW_DAYS],
    );
  }

  private async applyOutcome(line: StatementLine, outcome: MatchOutcome): Promise<void> {
    line.matchStatus = outcome.status;
    line.matchedPaymentRequestId = outcome.paymentRequestId ?? null;
    line.matchedIncomingReceiptId = outcome.incomingReceiptId ?? null;
    line.matchScore = outcome.score != null ? outcome.score.toFixed(2) : null;
    line.matchReason = outcome.reason;
    if (outcome.status === 'MATCHED') {
      line.matchedAt = new Date();
    }

    if (outcome.status === 'EXCEPTION') {
      const exception = await this.createException(line);
      line.exceptionId = exception.id;
    } else if (line.exceptionId) {
      // Re-running the matcher cleared a previously-open exception.
      await this.exceptionRepo.update(line.exceptionId, {
        status: 'RESOLVED_WITH_JUSTIFICATION',
        resolvedAt: new Date(),
        resolutionNote: 'Auto-resolved on rerun: line is no longer an exception.',
      });
      line.exceptionId = null;
    }

    await this.lineRepo.save(line);
  }

  private async createException(line: StatementLine): Promise<ReconciliationException> {
    const exceptionNumber = await this.nextExceptionNumber();
    const entity = this.exceptionRepo.create({
      exceptionNumber,
      statementUploadId: line.statementUploadId,
      statementLineId: line.id,
      bankAccountId: line.bankAccountId,
      exceptionType:
        line.direction === 'DEBIT' ? 'UNAUTHORISED_PAYMENT' : 'UNIDENTIFIED_RECEIPT',
      status: 'OPEN',
      amount: line.amount,
      currencyCode: line.currencyCode,
      valueDate: line.valueDate,
      bankReference: line.bankReference,
      counterpartyText: line.counterpartyText,
      narrative: line.narrative,
    });
    return this.exceptionRepo.save(entity);
  }

  private async nextExceptionNumber(): Promise<string> {
    const rows = await this.dataSource.query<Array<{ n: string }>>(
      `SELECT nextval('reconciliation_exception_seq') AS n`,
    );
    const seq = Number(rows[0].n);
    const year = new Date().getFullYear();
    return `RE-${year}-${String(seq).padStart(5, '0')}`;
  }

  private amountsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
    if (a == null || b == null) return false;
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
    return Math.abs(na - nb) < 0.005;
  }

  private nameLooksLike(
    statementText: string | null | undefined,
    ...candidateNames: Array<string | null | undefined>
  ): boolean {
    if (!statementText) return false;
    const haystack = this.normaliseName(statementText);
    if (!haystack) return false;
    for (const candidate of candidateNames) {
      if (!candidate) continue;
      const needle = this.normaliseName(candidate);
      if (!needle) continue;
      if (haystack.includes(needle) || needle.includes(haystack)) return true;
      const hayTokens = new Set(haystack.split(' ').filter((t) => t.length >= 4));
      const overlap = needle
        .split(' ')
        .filter((t) => t.length >= 4)
        .filter((t) => hayTokens.has(t)).length;
      if (overlap >= 2) return true;
    }
    return false;
  }

  private normaliseName(s: string): string {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
