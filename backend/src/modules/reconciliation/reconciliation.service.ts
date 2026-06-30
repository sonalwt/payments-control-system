import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { StatementUpload } from './statement-upload.entity';
import { StatementLine } from './statement-line.entity';
import { ReconciliationException } from './reconciliation-exception.entity';
import {
  ConfirmMatchDto,
  ExceptionQueryDto,
  IngestDto,
  InvestigateDto,
  ResolveExceptionDto,
  UnmatchDto,
} from './dto/reconciliation.dto';
import {
  parseStatementCsv,
  StatementParseError,
  type ParsedStatementLine,
} from './statement-csv.parser';
import { parseStatementPdf } from './statement-pdf.parser';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { PaymentRequest } from '../payment-requests/payment-request.entity';
import { IncomingReceipt } from '../incoming-receipts/incoming-receipt.entity';
import { S3Service } from '../uploads/s3.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { dubaiYear } from '../../common/utils/datetime';

const AMOUNT_EPSILON = 0.005;
const DATE_WINDOW_DAYS = 5;

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(StatementUpload)
    private readonly uploadRepo: Repository<StatementUpload>,
    @InjectRepository(StatementLine)
    private readonly lineRepo: Repository<StatementLine>,
    @InjectRepository(ReconciliationException)
    private readonly exceptionRepo: Repository<ReconciliationException>,
    private readonly dataSource: DataSource,
    private readonly s3: S3Service,
  ) {}

  // ---------------------------------------------------------------------
  // Statement lines
  // ---------------------------------------------------------------------

  async getLines(uploadId: string): Promise<StatementLine[]> {
    await this.requireUpload(this.dataSource.manager, uploadId);
    return this.lineRepo.find({
      where: { statementUploadId: uploadId },
      relations: ['matchedPaymentRequest', 'matchedIncomingReceipt'],
      order: { lineIndex: 'ASC' },
    });
  }

  /**
   * §8.1 / §8.2 — parse the uploaded statement (CSV or PDF) into statement
   * lines, then (by default) run the auto-matcher. Parse failures are persisted
   * on the upload as PARSE_FAILED so the operator can see the cause; PDF parses
   * are best-effort and any uncertainty is surfaced as a review note on the
   * upload (the upload's `ingestionError` doubles as that flag).
   */
  async ingestCsv(uploadId: string, dto: IngestDto, actorId: string): Promise<StatementUpload> {
    return this.dataSource.transaction(async (em) => {
      const upload = await this.requireUpload(em, uploadId);
      const account = await em.findOne(BankAccount, {
        where: { id: upload.bankAccountId },
        relations: ['currency'],
      });
      const currencyCode = account?.currency?.code ?? '';

      const format = upload.ingestionFormat ?? detectFormat(upload.fileUrl);
      if (format !== 'CSV' && format !== 'PDF') {
        upload.ingestionStatus = 'PARSE_FAILED';
        upload.ingestionError =
          'Unsupported statement file type. Upload a CSV or PDF bank statement.';
        await em.save(upload);
        return this.loadUpload(em, uploadId);
      }

      let buf: Buffer;
      try {
        buf = await this.s3.getFile(upload.fileUrl);
      } catch (err) {
        upload.ingestionStatus = 'PARSE_FAILED';
        upload.ingestionError = `Could not read the uploaded file: ${
          err instanceof Error ? err.message : String(err)
        }`;
        await em.save(upload);
        return this.loadUpload(em, uploadId);
      }

      try {
        let parsed: ParsedStatementLine[];
        let warnings: string[] = [];
        if (format === 'PDF') {
          const result = await parseStatementPdf(buf, {
            openingBalance: Number(upload.openingBalance),
            closingBalance: Number(upload.closingBalance),
          });
          parsed = result.lines;
          warnings = result.warnings;
        } else {
          parsed = parseStatementCsv(buf.toString('utf8'));
        }
        // Replace any prior lines for an idempotent re-ingest.
        await em.delete(ReconciliationException, { statementUploadId: uploadId });
        await em.delete(StatementLine, { statementUploadId: uploadId });

        const lines = parsed.map((p, i) =>
          em.create(StatementLine, {
            statementUploadId: uploadId,
            bankAccountId: upload.bankAccountId,
            lineIndex: i + 1,
            valueDate: p.valueDate,
            postingDate: p.postingDate ?? null,
            direction: p.direction,
            amount: p.amount,
            currencyCode: currencyCode || 'XXX',
            bankReference: p.bankReference ?? null,
            counterpartyText: p.counterpartyText ?? null,
            narrative: p.narrative ?? null,
            runningBalance: p.runningBalance ?? null,
            matchStatus: 'UNMATCHED' as const,
          }),
        );
        await em.save(lines);

        upload.rowCount = lines.length;
        upload.ingestionStatus = 'PARSED';
        // Best-effort PDF parses surface any uncertainty as a review note so the
        // operator can sanity-check the flagged upload (lines are still created).
        upload.ingestionError = warnings.length
          ? `REVIEW (best-effort PDF parse): ${warnings.join(' ')}`
          : null;
        upload.ingestionFormat = format;
        await em.save(upload);

        if (dto.runAutoMatch !== false) {
          await this.runMatcher(em, uploadId, actorId);
        } else {
          await this.refreshCounts(em, uploadId);
        }
      } catch (err) {
        if (err instanceof StatementParseError) {
          upload.ingestionStatus = 'PARSE_FAILED';
          upload.ingestionError = err.message;
          await em.save(upload);
          return this.loadUpload(em, uploadId);
        }
        throw err;
      }

      return this.loadUpload(em, uploadId);
    });
  }

  /** §8.2 — re-run the matcher, preserving manually-confirmed matches. */
  async rerunMatcher(uploadId: string, actorId: string): Promise<StatementUpload> {
    return this.dataSource.transaction(async (em) => {
      await this.requireUpload(em, uploadId);
      const lines = await em.find(StatementLine, { where: { statementUploadId: uploadId } });
      const resetIds = lines.filter((l) => !l.matchedBy).map((l) => l.id);
      if (resetIds.length) {
        // Drop exceptions tied to the lines we are about to re-evaluate.
        await em
          .createQueryBuilder()
          .delete()
          .from(ReconciliationException)
          .where('statement_line_id IN (:...ids)', { ids: resetIds })
          .execute();
        for (const l of lines) {
          if (l.matchedBy) continue;
          l.matchStatus = 'UNMATCHED';
          l.matchedPaymentRequestId = null;
          l.matchedIncomingReceiptId = null;
          l.matchScore = null;
          l.matchReason = null;
          l.matchedAt = null;
          l.exceptionId = null;
        }
        await em.save(lines.filter((l) => !l.matchedBy));
      }
      await this.runMatcher(em, uploadId, actorId);
      return this.loadUpload(em, uploadId);
    });
  }

  async confirmMatch(lineId: string, dto: ConfirmMatchDto, actorId: string): Promise<StatementLine> {
    return this.dataSource.transaction(async (em) => {
      const line = await em.findOne(StatementLine, { where: { id: lineId } });
      if (!line) throw new NotFoundException(`Statement line ${lineId} not found`);
      if (line.matchStatus !== 'CANDIDATE') {
        throw new BadRequestException('Only candidate matches can be confirmed.');
      }
      line.matchStatus = 'MATCHED';
      line.matchScore = '1.00';
      line.matchedBy = actorId;
      line.matchedAt = new Date();
      if (dto.note) {
        line.matchReason = `${line.matchReason ?? ''}${line.matchReason ? ' · ' : ''}Confirmed: ${dto.note}`;
      }
      if (line.exceptionId) {
        await em.delete(ReconciliationException, { id: line.exceptionId });
        line.exceptionId = null;
      }
      await em.save(line);
      await this.refreshCounts(em, line.statementUploadId);
      return this.loadLine(em, lineId);
    });
  }

  /** §8.3 — manually route a (mis)matched line to the exception queue. */
  async unmatch(lineId: string, dto: UnmatchDto, actorId: string): Promise<StatementLine> {
    return this.dataSource.transaction(async (em) => {
      const line = await em.findOne(StatementLine, { where: { id: lineId } });
      if (!line) throw new NotFoundException(`Statement line ${lineId} not found`);
      if (line.matchStatus !== 'MATCHED' && line.matchStatus !== 'CANDIDATE') {
        throw new BadRequestException('Only matched or candidate lines can be unmatched.');
      }
      line.matchedPaymentRequestId = null;
      line.matchedIncomingReceiptId = null;
      line.matchScore = null;
      line.matchedBy = null;
      line.matchedAt = null;
      line.matchReason = `Manually unmatched: ${dto.reason}`;
      await this.escalateToException(em, line);
      await em.save(line);
      await this.refreshCounts(em, line.statementUploadId);
      return this.loadLine(em, lineId);
    });
  }

  // ---------------------------------------------------------------------
  // Exceptions (§8.3)
  // ---------------------------------------------------------------------

  async findExceptions(query: ExceptionQueryDto): Promise<PaginatedResult<ReconciliationException>> {
    const { page = 1, limit = 20, status, exceptionType, statementUploadId } = query;
    const qb = this.exceptionRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.bankAccount', 'bankAccount')
      .leftJoinAndSelect('bankAccount.bank', 'bank')
      .leftJoinAndSelect('bankAccount.currency', 'currency')
      .orderBy('e.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (status) qb.andWhere('e.status = :status', { status });
    if (exceptionType) qb.andWhere('e.exceptionType = :exceptionType', { exceptionType });
    if (statementUploadId) qb.andWhere('e.statementUploadId = :statementUploadId', { statementUploadId });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async startInvestigation(
    id: string,
    dto: InvestigateDto,
    actorId: string,
  ): Promise<ReconciliationException> {
    const ex = await this.requireException(id);
    if (ex.status !== 'OPEN') {
      throw new BadRequestException('Only OPEN exceptions can be moved to investigation.');
    }
    ex.status = 'UNDER_INVESTIGATION';
    ex.investigatedBy = actorId;
    ex.investigatedAt = new Date();
    if (dto.note) ex.resolutionNote = dto.note;
    return this.exceptionRepo.save(ex);
  }

  async resolveException(
    id: string,
    dto: ResolveExceptionDto,
    actorId: string,
  ): Promise<ReconciliationException> {
    return this.closeException(id, 'RESOLVED_WITH_JUSTIFICATION', dto.resolutionNote, actorId);
  }

  async confirmException(
    id: string,
    dto: ResolveExceptionDto,
    actorId: string,
  ): Promise<ReconciliationException> {
    return this.closeException(id, 'CONFIRMED_EXCEPTION', dto.resolutionNote, actorId);
  }

  // ---------------------------------------------------------------------
  // Matcher core
  // ---------------------------------------------------------------------

  private async runMatcher(em: EntityManager, uploadId: string, actorId: string): Promise<void> {
    const upload = await this.requireUpload(em, uploadId);
    const lines = await em.find(StatementLine, {
      where: { statementUploadId: uploadId },
      order: { lineIndex: 'ASC' },
    });

    // §8.2 — the account's tiered bank charges. A debit on the statement is the
    // payment amount *plus* whatever charge the bank levied, so the matcher must
    // consider the charge-inclusive amount as well as the net payment amount.
    const account = await em.findOne(BankAccount, {
      where: { id: upload.bankAccountId },
      relations: ['chargeBands'],
    });
    const chargeBands = account?.chargeBands ?? [];

    // Records already reserved by preserved (manually-confirmed) matches.
    const reservedPayments = new Set<string>(
      lines.map((l) => l.matchedPaymentRequestId).filter((x): x is string => !!x),
    );
    const reservedReceipts = new Set<string>(
      lines.map((l) => l.matchedIncomingReceiptId).filter((x): x is string => !!x),
    );

    const completedPayments = await em.find(PaymentRequest, {
      where: { status: 'COMPLETED', sourceAccountId: upload.bankAccountId },
    });
    const receivedReceipts = await em.find(IncomingReceipt, {
      where: { status: 'RECEIVED', receiveFromAccountId: upload.bankAccountId },
    });

    for (const line of lines) {
      if (line.matchStatus !== 'UNMATCHED') continue;
      const lineAmount = Number(line.amount);

      if (line.direction === 'DEBIT') {
        const best = pickBest(
          completedPayments
            .filter((p) => !reservedPayments.has(p.id))
            .map((p) => {
              const amount = Number(p.amount);
              return {
                id: p.id,
                amount,
                charge: computeBankCharge(amount, chargeBands),
                ref: p.bankReference ?? p.treasuryReferenceNumber ?? null,
                date: (p.valueDate as string | null) ?? toDate(p.completedAt) ?? toDate(p.paidAt),
              };
            }),
          lineAmount,
          line.bankReference,
          line.valueDate,
        );
        if (best) {
          reservedPayments.add(best.id);
          line.matchStatus = best.status;
          line.matchedPaymentRequestId = best.id;
          line.matchScore = best.score.toFixed(2);
          line.matchReason = best.reason;
          line.matchedAt = new Date();
        } else {
          await this.escalateToException(em, line);
        }
      } else {
        const best = pickBest(
          receivedReceipts
            .filter((r) => !reservedReceipts.has(r.id))
            .map((r) => ({
              id: r.id,
              amount: Number(r.receivedAmount ?? r.expectedAmount),
              ref: r.inwardBankReference ?? null,
              date: toDate(r.receivedAt),
            })),
          lineAmount,
          line.bankReference,
          line.valueDate,
        );
        if (best) {
          reservedReceipts.add(best.id);
          line.matchStatus = best.status;
          line.matchedIncomingReceiptId = best.id;
          line.matchScore = best.score.toFixed(2);
          line.matchReason = best.reason;
          line.matchedAt = new Date();
        } else {
          await this.escalateToException(em, line);
        }
      }
    }

    await em.save(lines);

    upload.ingestionStatus = 'MATCHED';
    upload.autoMatchCompletedAt = new Date();
    await em.save(upload);
    await this.refreshCounts(em, uploadId);
  }

  /** Create (or reuse) the exception row for an unmatched/unmatched-manually line. */
  private async escalateToException(em: EntityManager, line: StatementLine): Promise<void> {
    line.matchStatus = 'EXCEPTION';
    const exceptionNumber = await this.nextExceptionNumber(em);
    const exception = em.create(ReconciliationException, {
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
      bankReference: line.bankReference ?? null,
      counterpartyText: line.counterpartyText ?? null,
      narrative: line.narrative ?? null,
    });
    const saved = await em.save(exception);
    line.exceptionId = saved.id;
  }

  private async closeException(
    id: string,
    status: 'RESOLVED_WITH_JUSTIFICATION' | 'CONFIRMED_EXCEPTION',
    note: string,
    actorId: string,
  ): Promise<ReconciliationException> {
    const ex = await this.requireException(id);
    if (ex.status === 'RESOLVED_WITH_JUSTIFICATION' || ex.status === 'CONFIRMED_EXCEPTION') {
      throw new BadRequestException('This exception is already closed.');
    }
    ex.status = status;
    ex.resolutionNote = note;
    ex.resolvedBy = actorId;
    ex.resolvedAt = new Date();
    return this.exceptionRepo.save(ex);
  }

  private async refreshCounts(em: EntityManager, uploadId: string): Promise<void> {
    const rows = (await em.query(
      `SELECT match_status, COUNT(*)::int AS c
         FROM bank_statement_lines
        WHERE statement_upload_id = $1
        GROUP BY match_status`,
      [uploadId],
    )) as Array<{ match_status: string; c: number }>;
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.match_status] = r.c;
    await em.update(StatementUpload, { id: uploadId }, {
      matchedCount: counts['MATCHED'] ?? 0,
      candidateCount: counts['CANDIDATE'] ?? 0,
      exceptionCount: counts['EXCEPTION'] ?? 0,
    });
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private async requireUpload(em: EntityManager, id: string): Promise<StatementUpload> {
    const upload = await em.findOne(StatementUpload, { where: { id } });
    if (!upload) throw new NotFoundException(`Statement upload ${id} not found`);
    return upload;
  }

  private loadUpload(em: EntityManager, id: string): Promise<StatementUpload> {
    return em.findOneOrFail(StatementUpload, {
      where: { id },
      relations: ['bankAccount', 'bankAccount.bank', 'bankAccount.currency', 'uploader'],
    });
  }

  private loadLine(em: EntityManager, id: string): Promise<StatementLine> {
    return em.findOneOrFail(StatementLine, {
      where: { id },
      relations: ['matchedPaymentRequest', 'matchedIncomingReceipt'],
    });
  }

  private async requireException(id: string): Promise<ReconciliationException> {
    const ex = await this.exceptionRepo.findOne({ where: { id } });
    if (!ex) throw new NotFoundException(`Reconciliation exception ${id} not found`);
    return ex;
  }

  private async nextExceptionNumber(em: EntityManager): Promise<string> {
    const rows = (await em.query(
      "SELECT nextval('reconciliation_exception_seq') AS n",
    )) as Array<{ n: string }>;
    return `EXC-${dubaiYear()}-${String(Number(rows[0].n)).padStart(5, '0')}`;
  }
}

// -----------------------------------------------------------------------
// Pure matcher scoring
// -----------------------------------------------------------------------

interface Candidate {
  id: string;
  amount: number;
  /** Bank charge the bank adds on top of `amount` for this account (0 if none). */
  charge?: number;
  ref: string | null;
  date: string | null;
}

interface MatchPick {
  id: string;
  status: 'MATCHED' | 'CANDIDATE';
  score: number;
  reason: string;
}

/**
 * §8.2 — score candidates by amount, bank reference and value date and pick
 * the strongest. Exact amount + reference is an automatic MATCH; an amount
 * match with a close value date is presented as a CANDIDATE for human
 * confirmation. Anything weaker yields no match (the line becomes an
 * exception).
 */
function pickBest(
  candidates: Candidate[],
  lineAmount: number,
  lineRef: string | null | undefined,
  lineDate: string,
): MatchPick | null {
  let best: MatchPick | null = null;
  for (const c of candidates) {
    const charge = c.charge ?? 0;
    const grossAmount = c.amount + charge;
    const netMatch = Math.abs(c.amount - lineAmount) < AMOUNT_EPSILON;
    // The statement debit may include the bank's charge on top of the payment.
    const grossMatch = charge > 0 && Math.abs(grossAmount - lineAmount) < AMOUNT_EPSILON;
    const amountMatch = netMatch || grossMatch;
    if (!amountMatch) continue;
    // When only the charge-inclusive amount lines up, say so in the reason.
    const chargeNote = !netMatch && grossMatch
      ? ` (incl. bank charge ${charge.toFixed(2)})`
      : '';
    const refMatch = !!lineRef && !!c.ref && normaliseRef(lineRef) === normaliseRef(c.ref);
    const days = c.date ? dayDiff(lineDate, c.date) : Number.POSITIVE_INFINITY;
    const dateClose = days <= DATE_WINDOW_DAYS;

    let pick: MatchPick;
    if (refMatch && amountMatch) {
      pick = { id: c.id, status: 'MATCHED', score: 1.0, reason: `Exact amount and bank reference match${chargeNote}` };
    } else if (amountMatch && dateClose) {
      pick = {
        id: c.id,
        status: 'CANDIDATE',
        score: 0.6,
        reason: `Amount match with value date within ${DATE_WINDOW_DAYS} days${chargeNote}`,
      };
    } else {
      pick = { id: c.id, status: 'CANDIDATE', score: 0.5, reason: `Amount match only${chargeNote}` };
    }
    if (!best || pick.score > best.score) best = pick;
  }
  return best;
}

function normaliseRef(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * §8.2 — bank charge for a payment of `amount` on an account, derived from its
 * tiered charge bands. The band whose [minAmount, maxAmount) range contains the
 * amount sets the percentage; an open-ended band (maxAmount = null) covers
 * everything at or above its min. Returns 0 when no band applies.
 */
function computeBankCharge(
  amount: number,
  bands: Array<{ minAmount: number; maxAmount?: number | null; percentage: number }>,
): number {
  if (!bands.length || !(amount > 0)) return 0;
  const band = bands.find(
    (b) => amount >= b.minAmount && (b.maxAmount == null || amount < b.maxAmount),
  );
  if (!band) return 0;
  return Number((amount * (band.percentage / 100)).toFixed(4));
}

function toDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const da = Date.parse(`${a.slice(0, 10)}T00:00:00Z`);
  const db = Date.parse(`${b.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return Number.POSITIVE_INFINITY;
  return Math.abs(da - db) / 86_400_000;
}

function detectFormat(fileUrl: string): 'CSV' | 'PDF' | null {
  const lower = fileUrl.toLowerCase();
  if (lower.endsWith('.csv')) return 'CSV';
  if (lower.endsWith('.pdf')) return 'PDF';
  return null;
}
