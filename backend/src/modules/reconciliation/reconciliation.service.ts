import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { StatementLine } from './statement-line.entity';
import { StatementUpload } from '../statement-uploads/statement-upload.entity';
import { StatementCsvParser } from './statement-csv.parser';
import { ReconciliationMatcherService } from './reconciliation-matcher.service';
import { IngestCsvDto, IngestManualDto } from './dto/ingest.dto';
import { ConfirmMatchDto, UnmatchLineDto } from './dto/match.dto';
import { RoleCode } from '../../common/enums/role.enum';

/** §9.4 — Roles that may see lines for chairman-designated bank accounts. */
const CHAIRMAN_EXECUTION_ROLES: string[] = [
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
];

/**
 * SOW §8.1 / §8.2 — Reconciliation orchestrator. Wraps the CSV parser and
 * matcher, and provides the line-level confirm / unmatch operations.
 *
 * Intentionally separate from StatementUploadsService so the upload flow
 * (balance reset + amount lock) remains untouched.
 */
@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(StatementLine)
    private readonly lineRepo: Repository<StatementLine>,
    @InjectRepository(StatementUpload)
    private readonly uploadRepo: Repository<StatementUpload>,
    private readonly csvParser: StatementCsvParser,
    private readonly matcher: ReconciliationMatcherService,
  ) {}

  // -------------------------------------------------------------------
  // §8.1 — ingestion
  // -------------------------------------------------------------------

  async ingestCsv(uploadId: string, dto: IngestCsvDto): Promise<StatementUpload> {
    const upload = await this.requireUpload(uploadId);
    if (upload.ingestionStatus === 'PARSED' || upload.ingestionStatus === 'MATCHED') {
      throw new BadRequestException(
        'This statement has already been ingested. Delete its lines first to re-ingest.',
      );
    }

    const fileUrl = dto.csvFileUrl ?? upload.fileUrl;
    if (!fileUrl) {
      throw new BadRequestException('No CSV file URL available on this upload.');
    }

    const buffer = this.readUploadedFile(fileUrl);

    let parsed;
    try {
      parsed = this.csvParser.parse(buffer, dto.columnMapping);
    } catch (err) {
      await this.uploadRepo.update(upload.id, {
        ingestionStatus: 'PARSE_FAILED',
        ingestionFormat: this.detectFormat(fileUrl),
        ingestionError: (err as Error).message,
      });
      throw err;
    }

    const fullUpload = await this.uploadRepo.findOne({
      where: { id: upload.id },
      relations: { bankAccount: { currency: true } },
    });
    const currencyCode = fullUpload?.bankAccount?.currency?.code ?? 'XXX';

    const lines = parsed.map((p) =>
      this.lineRepo.create({
        statementUploadId: upload.id,
        bankAccountId: upload.bankAccountId,
        lineIndex: p.lineIndex,
        valueDate: p.valueDate,
        postingDate: p.postingDate,
        direction: p.direction,
        amount: p.amount,
        currencyCode,
        bankReference: p.bankReference,
        counterpartyText: p.counterpartyText,
        narrative: p.narrative,
        runningBalance: p.runningBalance,
        matchStatus: 'UNMATCHED',
        rawRow: p.rawRow,
      }),
    );

    await this.lineRepo.save(lines);

    await this.uploadRepo.update(upload.id, {
      ingestionStatus: 'PARSED',
      ingestionFormat: this.detectFormat(fileUrl) ?? 'CSV',
      ingestionError: null,
    });

    if (dto.runAutoMatch !== false) {
      await this.matcher.runForUpload(upload.id);
    }

    return this.requireUpload(upload.id);
  }

  async ingestManual(uploadId: string, dto: IngestManualDto): Promise<StatementUpload> {
    const upload = await this.requireUpload(uploadId);
    if (upload.ingestionStatus === 'PARSED' || upload.ingestionStatus === 'MATCHED') {
      throw new BadRequestException(
        'This statement has already been ingested. Delete its lines first to re-ingest.',
      );
    }
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one statement line is required.');
    }

    const lines = dto.lines.map((l, idx) =>
      this.lineRepo.create({
        statementUploadId: upload.id,
        bankAccountId: upload.bankAccountId,
        lineIndex: idx + 1,
        valueDate: l.valueDate,
        postingDate: l.postingDate ?? null,
        direction: l.direction,
        amount: String(l.amount),
        currencyCode: l.currencyCode.toUpperCase(),
        bankReference: l.bankReference ?? null,
        counterpartyText: l.counterpartyText ?? null,
        narrative: l.narrative ?? null,
        runningBalance: l.runningBalance != null ? String(l.runningBalance) : null,
        matchStatus: 'UNMATCHED',
        rawRow: { source: 'manual', ...l },
      }),
    );

    await this.lineRepo.save(lines);

    await this.uploadRepo.update(upload.id, {
      ingestionStatus: 'PARSED',
      ingestionFormat: upload.ingestionFormat ?? this.detectFormat(upload.fileUrl) ?? 'PDF',
      ingestionError: null,
    });

    if (dto.runAutoMatch !== false) {
      await this.matcher.runForUpload(upload.id);
    }

    return this.requireUpload(upload.id);
  }

  async rerunMatcher(uploadId: string): Promise<StatementUpload> {
    await this.requireUpload(uploadId);
    await this.matcher.runForUpload(uploadId);
    return this.requireUpload(uploadId);
  }

  // -------------------------------------------------------------------
  // §8.2 — line view + confirm / unmatch
  // -------------------------------------------------------------------

  async listLines(uploadId: string, userRoles: string[] = []): Promise<StatementLine[]> {
    const upload = await this.requireUpload(uploadId);

    // §9.4 — Lines for chairman-designated accounts are visible only to the
    // execution team (Maker / Checker / Head). Other roles receive an empty
    // array rather than an error so the UI degrades gracefully.
    if (upload.bankAccount?.isChairmanDesignated) {
      const canSee = CHAIRMAN_EXECUTION_ROLES.some((r) => userRoles.includes(r));
      if (!canSee) return [];
    }

    return this.lineRepo.find({
      where: { statementUploadId: uploadId },
      relations: {
        matchedPaymentRequest: true,
        matchedIncomingReceipt: true,
      },
      order: { lineIndex: 'ASC' },
    });
  }

  async getLine(lineId: string): Promise<StatementLine> {
    const line = await this.lineRepo.findOne({
      where: { id: lineId },
      relations: {
        matchedPaymentRequest: true,
        matchedIncomingReceipt: true,
        statementUpload: true,
      },
    });
    if (!line) throw new NotFoundException(`Statement line ${lineId} not found.`);
    return line;
  }

  async confirmMatch(
    lineId: string,
    dto: ConfirmMatchDto,
    userId: string,
  ): Promise<StatementLine> {
    const line = await this.getLine(lineId);
    if (line.matchStatus === 'MATCHED') {
      throw new BadRequestException('This line is already matched.');
    }
    return this.matcher.confirmCandidate(
      line,
      userId,
      {
        paymentRequestId: dto.paymentRequestId ?? null,
        incomingReceiptId: dto.incomingReceiptId ?? null,
      },
      dto.note,
    );
  }

  async unmatchLine(
    lineId: string,
    dto: UnmatchLineDto,
    userId: string,
  ): Promise<StatementLine> {
    const line = await this.getLine(lineId);
    if (line.matchStatus !== 'MATCHED' && line.matchStatus !== 'CANDIDATE') {
      throw new BadRequestException(
        'Only matched or candidate lines can be unmatched.',
      );
    }
    return this.matcher.unmatch(line, dto.reason, userId);
  }

  // -------------------------------------------------------------------

  private async requireUpload(id: string): Promise<StatementUpload> {
    const upload = await this.uploadRepo.findOne({
      where: { id },
      relations: { bankAccount: { bank: true, currency: true } },
    });
    if (!upload) throw new NotFoundException(`Statement upload ${id} not found.`);
    return upload;
  }

  private detectFormat(fileUrl: string): 'CSV' | 'PDF' | null {
    const lower = fileUrl.toLowerCase();
    if (lower.endsWith('.csv')) return 'CSV';
    if (lower.endsWith('.pdf')) return 'PDF';
    return null;
  }

  private readUploadedFile(fileUrl: string): Buffer {
    let relative = fileUrl;
    if (relative.startsWith('/uploads/')) relative = relative.slice('/uploads/'.length);
    const abs = path.join(process.cwd(), 'uploads', relative);
    if (!fs.existsSync(abs)) {
      throw new BadRequestException(`Uploaded file not found on server: ${fileUrl}`);
    }
    return fs.readFileSync(abs);
  }
}
