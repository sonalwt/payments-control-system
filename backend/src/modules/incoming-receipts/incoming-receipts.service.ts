import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { IncomingReceipt } from './incoming-receipt.entity';
import { IncomingReceiptDocument } from './incoming-receipt-document.entity';
import {
  AttachReceiptDocumentDto,
  CancelReceiptDto,
  CreateIncomingReceiptDto,
  IncomingReceiptQueryDto,
  MarkReceivedDto,
  UpdateIncomingReceiptDto,
} from './dto/incoming-receipt.dto';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ImportResult, parseImportFile } from '../../common/helpers/parse-import-file';
import { dubaiYear } from '../../common/utils/datetime';

@Injectable()
export class IncomingReceiptsService {
  private readonly logger = new Logger(IncomingReceiptsService.name);

  constructor(
    @InjectRepository(IncomingReceipt)
    private readonly repo: Repository<IncomingReceipt>,
    @InjectRepository(IncomingReceiptDocument)
    private readonly docRepo: Repository<IncomingReceiptDocument>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
  ) {}

  // ---------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------

  async create(dto: CreateIncomingReceiptDto, actorId: string): Promise<IncomingReceipt> {
    return this.dataSource.transaction(async (em) => {
      const receiptNumber = await this.nextReceiptNumber(em);
      const receipt = em.create(IncomingReceipt, {
        receiptNumber,
        legalEntityId: dto.legalEntityId,
        counterpartyId: dto.counterpartyId,
        receiveFromAccountId: dto.receiveFromAccountId,
        expectedAmount: dto.expectedAmount,
        expectedCurrencyCode: dto.expectedCurrencyCode.toUpperCase(),
        purposeDescription: dto.purposeDescription ?? null,
        receivedFromAccount: dto.receivedFromAccount ?? null,
        status: 'DRAFT',
        createdBy: actorId,
        updatedBy: actorId,
      });
      const saved = await em.save(receipt);
      if (dto.documents?.length) {
        await this.saveDocuments(em, saved.id, dto.documents, actorId);
      }
      return this.loadOne(saved.id, em);
    });
  }

  /**
   * Bulk-create incoming receipts (as DRAFT) from a CSV/Excel upload. Foreign
   * keys are resolved from human-friendly codes/numbers: legal entity code,
   * counterparty code, and the receive-to (group) bank account number. Each row
   * is independent — a bad row is skipped and reported, the rest still import.
   */
  async bulkImport(file: Express.Multer.File, actorId: string): Promise<ImportResult> {
    const rows = parseImportFile(file);
    const [entities, counterparties, accounts] = await Promise.all([
      this.dataSource.getRepository(LegalEntity).find({ select: ['id', 'code'] }),
      this.dataSource.getRepository(Counterparty).find({ select: ['id', 'code'] }),
      this.dataSource.getRepository(BankAccount).find({ select: ['id', 'accountNumber'] }),
    ]);
    const entityMap = new Map(entities.map((e) => [e.code.toUpperCase(), e.id]));
    const cpMap = new Map(counterparties.map((c) => [c.code.toUpperCase(), c.id]));
    const acctMap = new Map(accounts.map((a) => [a.accountNumber.trim(), a.id]));

    const AMOUNT_RE = /^\d+(\.\d{1,4})?$/;
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // header is row 1
      const fail = (message: string): void => {
        result.errors.push({ row: rowNum, message });
        result.skipped++;
      };

      const leCode = (row['legal_entity_code'] ?? '').toUpperCase();
      const cpCode = (row['counterparty_code'] ?? '').toUpperCase();
      const acctNo = (row['receive_to_account_number'] ?? '').trim();
      const amount = (row['expected_amount'] ?? '').trim();
      const ccy = (row['currency_code'] ?? '').trim().toUpperCase();
      const purpose = (row['purpose'] ?? '').trim();

      if (!leCode) { fail('legal_entity_code is required'); continue; }
      const legalEntityId = entityMap.get(leCode);
      if (!legalEntityId) { fail(`Legal entity code "${leCode}" not found`); continue; }

      if (!cpCode) { fail('counterparty_code is required'); continue; }
      const counterpartyId = cpMap.get(cpCode);
      if (!counterpartyId) { fail(`Counterparty code "${cpCode}" not found`); continue; }

      if (!acctNo) { fail('receive_to_account_number is required'); continue; }
      const receiveFromAccountId = acctMap.get(acctNo);
      if (!receiveFromAccountId) { fail(`Receive-to account number "${acctNo}" not found`); continue; }

      if (!AMOUNT_RE.test(amount)) { fail('expected_amount must be a positive decimal (max 4 dp)'); continue; }
      if (!ccy || ccy.length > 10) { fail('currency_code is required (max 10 chars)'); continue; }

      try {
        await this.create(
          {
            legalEntityId,
            counterpartyId,
            receiveFromAccountId,
            expectedAmount: amount,
            expectedCurrencyCode: ccy,
            purposeDescription: purpose || undefined,
          },
          actorId,
        );
        result.created++;
      } catch (e: unknown) {
        fail(e instanceof Error ? e.message : 'Unknown error');
      }
    }
    return result;
  }

  async findAll(query: IncomingReceiptQueryDto): Promise<PaginatedResult<IncomingReceipt>> {
    const { page = 1, limit = 20, search, status } = query;
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.counterparty', 'counterparty')
      .leftJoinAndSelect('r.legalEntity', 'legalEntity')
      .leftJoinAndSelect('r.receiveFromAccount', 'receiveFromAccount')
      .leftJoinAndSelect('receiveFromAccount.bank', 'receiveFromAccountBank')
      .leftJoinAndSelect('receiveFromAccount.currency', 'receiveFromAccountCurrency')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere(
        '(r.receiptNumber ILIKE :s OR r.purposeDescription ILIKE :s OR r.inwardBankReference ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (status) {
      qb.andWhere('r.status = :status', { status });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findOne(id: string): Promise<IncomingReceipt> {
    return this.loadOne(id, this.dataSource.manager);
  }

  async listDocuments(id: string): Promise<IncomingReceiptDocument[]> {
    await this.loadOne(id, this.dataSource.manager); // 404 if missing
    return this.docRepo.find({
      where: { incomingReceiptId: id },
      order: { uploadedAt: 'ASC' },
    });
  }

  async update(
    id: string,
    dto: UpdateIncomingReceiptDto,
    actorId: string,
  ): Promise<IncomingReceipt> {
    return this.dataSource.transaction(async (em) => {
      const receipt = await this.loadOne(id, em);
      if (receipt.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT receipts can be edited.');
      }
      if (dto.counterpartyId !== undefined) receipt.counterpartyId = dto.counterpartyId;
      if (dto.receiveFromAccountId !== undefined) {
        receipt.receiveFromAccountId = dto.receiveFromAccountId;
      }
      if (dto.expectedAmount !== undefined) receipt.expectedAmount = dto.expectedAmount;
      if (dto.expectedCurrencyCode !== undefined) {
        receipt.expectedCurrencyCode = dto.expectedCurrencyCode.toUpperCase();
      }
      if (dto.purposeDescription !== undefined) {
        receipt.purposeDescription = dto.purposeDescription ?? null;
      }
      if (dto.receivedFromAccount !== undefined) {
        receipt.receivedFromAccount = dto.receivedFromAccount ?? null;
      }
      receipt.updatedBy = actorId;
      await em.save(receipt);
      if (dto.documents?.length) {
        await this.saveDocuments(em, id, dto.documents, actorId);
      }
      return this.loadOne(id, em);
    });
  }

  async remove(id: string, actorId: string): Promise<void> {
    const receipt = await this.loadOne(id, this.dataSource.manager);
    if (receipt.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT receipts can be deleted.');
    }
    receipt.updatedBy = actorId;
    await this.repo.save(receipt);
    await this.repo.softRemove(receipt);
  }

  // ---------------------------------------------------------------------
  // Lifecycle (§7.2 / §7.3)
  // ---------------------------------------------------------------------

  async submit(id: string, actorId: string): Promise<IncomingReceipt> {
    return this.dataSource.transaction(async (em) => {
      const receipt = await this.loadOne(id, em);
      if (receipt.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT receipts can be submitted.');
      }
      const docCount = await em.count(IncomingReceiptDocument, {
        where: { incomingReceiptId: id },
      });
      if (docCount === 0) {
        throw new BadRequestException(
          'A debit note or final invoice must be attached before submitting (§7.1).',
        );
      }
      receipt.status = 'AWAITING_RECEIPT';
      receipt.submittedAt = new Date();
      receipt.updatedBy = actorId;
      await em.save(receipt);
      return this.loadOne(id, em);
    });
  }

  /**
   * §7.3 — the payments team marks the credit received. The recorded balance
   * of the receiving account is credited and the initiator is notified.
   */
  async markReceived(
    id: string,
    dto: MarkReceivedDto,
    actorId: string,
  ): Promise<IncomingReceipt> {
    const receipt = await this.dataSource.transaction(async (em) => {
      const r = await this.loadOne(id, em);
      if (r.status !== 'AWAITING_RECEIPT') {
        throw new BadRequestException(
          'Only receipts AWAITING_RECEIPT can be marked received.',
        );
      }

      const account = await em.findOne(BankAccount, {
        where: { id: dto.receiveFromAccountId },
      });
      if (!account) {
        throw new NotFoundException('Receive-from account not found.');
      }

      r.receiveFromAccountId = dto.receiveFromAccountId;
      // Keep the loaded relation in sync with the FK we just set; otherwise the
      // stale receiveFromAccount relation (from loadOne) overrides the scalar on
      // save and the receipt records a different account than the one credited.
      r.receiveFromAccount = account;
      r.inwardBankReference = dto.inwardBankReference;
      r.receivedAmount = dto.receivedAmount;
      r.receivedCurrencyCode = dto.receivedCurrencyCode.toUpperCase();
      r.receivedRemarks = dto.remarks ?? null;
      r.receivedAt = new Date(`${dto.receivedDate}T00:00:00Z`);
      r.status = 'RECEIVED';
      r.updatedBy = actorId;
      await em.save(r);

      // §2.5 — credit the receiving account's recorded balance on Received.
      const previous = Number(account.remainingBalance);
      const delta = Number(dto.receivedAmount);
      const next = previous + delta;
      account.remainingBalance = next;
      account.updatedBy = actorId;
      await em.save(account);
      await this.recordBalanceChange(em, {
        accountId: account.id,
        previous,
        next,
        delta,
        receiptId: r.id,
        actorId,
        reason: `Incoming receipt ${r.receiptNumber} received`,
      });

      return r;
    });

    await this.notifyInitiator(receipt);
    return this.findOne(id);
  }

  async cancel(id: string, dto: CancelReceiptDto, actorId: string): Promise<IncomingReceipt> {
    return this.dataSource.transaction(async (em) => {
      const receipt = await this.loadOne(id, em);
      if (receipt.status !== 'DRAFT' && receipt.status !== 'AWAITING_RECEIPT') {
        throw new BadRequestException(
          'This receipt cannot be cancelled in its current status.',
        );
      }
      receipt.status = 'CANCELLED';
      receipt.cancellationReason = dto.reason;
      receipt.updatedBy = actorId;
      await em.save(receipt);
      return this.loadOne(id, em);
    });
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private async loadOne(id: string, em: EntityManager): Promise<IncomingReceipt> {
    const receipt = await em.findOne(IncomingReceipt, {
      where: { id },
      relations: ['counterparty', 'legalEntity', 'receiveFromAccount'],
    });
    if (!receipt) throw new NotFoundException(`Incoming receipt ${id} not found`);
    return receipt;
  }

  private async saveDocuments(
    em: EntityManager,
    receiptId: string,
    docs: AttachReceiptDocumentDto[],
    actorId: string,
  ): Promise<void> {
    const rows = docs.map((d) =>
      em.create(IncomingReceiptDocument, {
        incomingReceiptId: receiptId,
        documentCode: d.documentCode,
        documentLabel: d.documentLabel ?? null,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileSizeBytes: d.fileSizeBytes ?? null,
        mimeType: d.mimeType ?? null,
        uploadedBy: actorId,
      }),
    );
    await em.save(rows);
  }

  private async nextReceiptNumber(em: EntityManager): Promise<string> {
    const rows = (await em.query("SELECT nextval('incoming_receipt_seq') AS n")) as Array<{
      n: string;
    }>;
    const seq = Number(rows[0].n);
    return `IR-${dubaiYear()}-${String(seq).padStart(5, '0')}`;
  }

  private async recordBalanceChange(
    em: EntityManager,
    p: {
      accountId: string;
      previous: number;
      next: number;
      delta: number;
      receiptId: string;
      actorId: string;
      reason: string;
    },
  ): Promise<void> {
    await em.query(
      `INSERT INTO balance_changes
        (account_id, kind, previous_balance, new_balance, delta, reason, receipt_id, changed_by)
       VALUES ($1, 'RECEIPT_CREDIT', $2, $3, $4, $5, $6, $7)`,
      [p.accountId, p.previous, p.next, p.delta, p.reason, p.receiptId, p.actorId],
    );
  }

  /** §7.3 — notify the initiator who raised the request that the credit landed. */
  private async notifyInitiator(receipt: IncomingReceipt): Promise<void> {
    if (!receipt.createdBy) return;
    try {
      const user = await this.userRepo.findOne({ where: { id: receipt.createdBy } });
      if (!user?.email) return;
      await this.mail.sendNotification(
        user.email,
        `Incoming receipt ${receipt.receiptNumber} marked received`,
        `Incoming receipt ${receipt.receiptNumber} for ` +
          `${receipt.receivedAmount} ${receipt.receivedCurrencyCode} has been marked received ` +
          `(inward reference ${receipt.inwardBankReference}).`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to notify initiator for receipt ${receipt.receiptNumber}: ${String(err)}`,
      );
    }
  }
}
