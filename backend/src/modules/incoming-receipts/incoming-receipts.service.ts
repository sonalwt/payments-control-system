import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import {
  IncomingReceipt,
  IncomingReceiptStatus,
} from './incoming-receipt.entity';
import { IncomingReceiptDocument } from './incoming-receipt-document.entity';
import { IncomingReceiptsRepository } from './incoming-receipts.repository';
import {
  CreateIncomingReceiptDto,
  IncomingReceiptDocumentDto,
} from './dto/create-incoming-receipt.dto';
import { UpdateIncomingReceiptDto } from './dto/update-incoming-receipt.dto';
import { CancelIncomingReceiptDto, MarkReceivedDto } from './dto/action.dto';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { EmailService } from '../../notifications/email.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface IncomingReceiptQuery extends PaginationQueryDto {
  status?: IncomingReceiptStatus;
  legalEntityId?: string;
  counterpartyId?: string;
}

const CANCELLABLE_STATUSES: IncomingReceiptStatus[] = ['DRAFT', 'AWAITING_RECEIPT'];

@Injectable()
export class IncomingReceiptsService {
  constructor(
    private readonly repo: IncomingReceiptsRepository,
    private readonly bankAccountsService: BankAccountsService,
    private readonly emailService: EmailService,
  ) {}

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  async create(dto: CreateIncomingReceiptDto, userId: string): Promise<IncomingReceipt> {
    const receiptNumber = await this.generateReceiptNumber();

    const entity = this.repo.create({
      receiptNumber,
      legalEntityId: dto.legalEntityId,
      counterpartyId: dto.counterpartyId,
      receiveFromAccountId: dto.receiveFromAccountId,
      expectedAmount: dto.expectedAmount,
      expectedCurrencyCode: dto.expectedCurrencyCode.toUpperCase(),
      purposeDescription: dto.purposeDescription ?? null,
      status: 'DRAFT',
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.repo.save(entity);

    if (dto.documents && dto.documents.length > 0) {
      await this.repo.saveDocuments(
        this.buildDocuments(dto.documents, saved.id, userId),
      );
    }

    return this.requireById(saved.id, true);
  }

  async findAll(
    query: IncomingReceiptQuery,
  ): Promise<PaginatedResult<IncomingReceipt>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      legalEntityId,
      counterpartyId,
    } = query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (legalEntityId) where.legalEntityId = legalEntityId;
    if (counterpartyId) where.counterpartyId = counterpartyId;

    const baseWhere = search
      ? [
          { ...where, receiptNumber: ILike(`%${search}%`) },
          { ...where, purposeDescription: ILike(`%${search}%`) },
        ]
      : Object.keys(where).length > 0
        ? where
        : undefined;

    const [data, total] = await this.repo.raw.findAndCount({
      where: baseWhere,
      relations: {
        legalEntity: true,
        counterparty: true,
        receiveFromAccount: { bank: true, currency: true },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<IncomingReceipt> {
    return this.requireById(id, true);
  }

  async update(
    id: string,
    dto: UpdateIncomingReceiptDto,
    user: AuthenticatedUser,
  ): Promise<IncomingReceipt> {
    const ir = await this.requireById(id);
    this.assertStatus(ir, 'DRAFT', 'edit');
    this.assertCreatorOrAdmin(ir, user, 'edit');

    if (dto.counterpartyId !== undefined) ir.counterpartyId = dto.counterpartyId;
    if (dto.receiveFromAccountId !== undefined)
      ir.receiveFromAccountId = dto.receiveFromAccountId;
    if (dto.expectedAmount !== undefined) ir.expectedAmount = dto.expectedAmount;
    if (dto.expectedCurrencyCode !== undefined)
      ir.expectedCurrencyCode = dto.expectedCurrencyCode.toUpperCase();
    if (dto.purposeDescription !== undefined)
      ir.purposeDescription = dto.purposeDescription ?? null;
    ir.updatedBy = user.id;

    await this.repo.save(ir);

    if (dto.documents && dto.documents.length > 0) {
      await this.repo.saveDocuments(this.buildDocuments(dto.documents, id, user.id));
    }

    return this.requireById(id, true);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const ir = await this.requireById(id);
    this.assertStatus(ir, 'DRAFT', 'delete');
    this.assertCreatorOrAdmin(ir, user, 'delete');
    ir.updatedBy = user.id;
    await this.repo.save(ir);
    await this.repo.softRemove(ir);
  }

  // -----------------------------------------------------------------------
  // §7 — Status transitions
  // -----------------------------------------------------------------------

  /**
   * §7.2 — Submit a receipt request. No approval chain; moves directly to
   * AWAITING_RECEIPT, queued for the payments team to confirm the credit.
   *
   * §7.1 — At least one supporting document (debit note / final invoice)
   * must be attached before submission.
   */
  async submit(id: string, user: AuthenticatedUser): Promise<IncomingReceipt> {
    const ir = await this.requireById(id);
    this.assertStatus(ir, 'DRAFT', 'submit');
    this.assertCreatorOrAdmin(ir, user, 'submit');

    const docs = await this.repo.findDocuments(id);
    if (docs.length === 0) {
      throw new BadRequestException(
        'At least one supporting document (debit note or final invoice) must be attached before submitting.',
      );
    }

    ir.status = 'AWAITING_RECEIPT';
    ir.submittedAt = new Date();
    ir.updatedBy = user.id;
    return this.repo.save(ir);
  }

  /**
   * §7.3 — Payments team marks the credit received.
   * AWAITING_RECEIPT → RECEIVED. Credits the receive-from account via the
   * existing BankAccountsService.creditForReceipt (§2.5). Initiator is
   * notified by email (failures logged, not rolled back).
   */
  async markReceived(
    id: string,
    user: AuthenticatedUser,
    dto: MarkReceivedDto,
  ): Promise<IncomingReceipt> {
    const ir = await this.requireById(id);
    this.assertStatus(ir, 'AWAITING_RECEIPT', 'mark received');

    // §14.1 / §15 — Separation of duties: the user marking received must not
    // be the user who created the receipt request.
    if (ir.createdBy && ir.createdBy === user.id) {
      throw new ForbiddenException(
        'Separation of duties: the user marking a receipt as received cannot be the same user who created the request.',
      );
    }

    await this.bankAccountsService.creditForReceipt({
      accountId: dto.receiveFromAccountId,
      amount: dto.receivedAmount,
      reason: `Incoming receipt ${ir.receiptNumber}`,
      paymentRequestId: null,
      receiptId: ir.id,
      userId: user.id,
    });

    ir.status = 'RECEIVED';
    ir.receiveFromAccountId = dto.receiveFromAccountId;
    ir.inwardBankReference = dto.inwardBankReference;
    ir.receivedAt = new Date(dto.receivedDate);
    ir.receivedAmount = dto.receivedAmount;
    ir.receivedCurrencyCode = dto.receivedCurrencyCode.toUpperCase();
    ir.receivedRemarks = dto.remarks ?? null;
    ir.updatedBy = user.id;
    const saved = await this.repo.save(ir);

    if (ir.createdBy) {
      const to = await this.repo.findUserEmail(ir.createdBy);
      if (to) {
        const subject = `Incoming receipt ${ir.receiptNumber} marked received`;
        const html =
          `<p>Incoming receipt <strong>${ir.receiptNumber}</strong> has been marked received.</p>` +
          `<ul>` +
          `<li>Amount: ${dto.receivedAmount} ${ir.receivedCurrencyCode}</li>` +
          `<li>Inward bank reference: ${dto.inwardBankReference}</li>` +
          `<li>Received on: ${dto.receivedDate}</li>` +
          (dto.remarks ? `<li>Remarks: ${dto.remarks}</li>` : '') +
          `</ul>`;
        void this.emailService.sendMail({ to, subject, html });
      }
    }

    return saved;
  }

  async cancel(
    id: string,
    user: AuthenticatedUser,
    dto: CancelIncomingReceiptDto,
  ): Promise<IncomingReceipt> {
    const ir = await this.requireById(id);
    if (!CANCELLABLE_STATUSES.includes(ir.status)) {
      throw new BadRequestException(
        `Cannot cancel a receipt that is already in terminal status ${ir.status}.`,
      );
    }
    // Initiators may only cancel their own drafts; the payments team and
    // Super Admin may cancel any receipt during review.
    const isPaymentsTeam =
      user.roles.includes(RoleCode.PAYMENTS_MAKER) ||
      user.roles.includes(RoleCode.PAYMENTS_CHECKER) ||
      user.roles.includes(RoleCode.SUPER_ADMIN);
    if (!isPaymentsTeam) {
      this.assertCreatorOrAdmin(ir, user, 'cancel');
    }
    ir.status = 'CANCELLED';
    ir.cancellationReason = dto.reason;
    ir.updatedBy = user.id;
    return this.repo.save(ir);
  }

  async getDocuments(id: string): Promise<IncomingReceiptDocument[]> {
    await this.requireById(id);
    return this.repo.findDocuments(id);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private async requireById(id: string, withRelations = false): Promise<IncomingReceipt> {
    const ir = await this.repo.findOneById(id, withRelations);
    if (!ir) throw new NotFoundException(`Incoming receipt ${id} not found.`);
    return ir;
  }

  private assertStatus(
    ir: IncomingReceipt,
    required: IncomingReceiptStatus,
    action: string,
  ): void {
    if (ir.status !== required) {
      throw new BadRequestException(
        `Cannot ${action} a receipt in ${ir.status} status (required: ${required}).`,
      );
    }
  }

  /**
   * Creator-only check, with SUPER_ADMIN bypass. Used by drafts-stage actions
   * (update, delete, submit, cancel-by-initiator).
   */
  private assertCreatorOrAdmin(
    ir: IncomingReceipt,
    user: AuthenticatedUser,
    action: string,
  ): void {
    if (user.roles.includes(RoleCode.SUPER_ADMIN)) return;
    if (ir.createdBy === user.id) return;
    throw new ForbiddenException(
      `You are not permitted to ${action} this receipt (only the creator or a Super Admin may).`,
    );
  }

  private async generateReceiptNumber(): Promise<string> {
    const seq = await this.repo.nextSequenceValue();
    const year = new Date().getFullYear();
    return `IR-${year}-${String(seq).padStart(5, '0')}`;
  }

  private buildDocuments(
    dtos: IncomingReceiptDocumentDto[],
    incomingReceiptId: string,
    userId: string,
  ): IncomingReceiptDocument[] {
    return dtos.map((d) => {
      const doc = new IncomingReceiptDocument();
      doc.incomingReceiptId = incomingReceiptId;
      doc.documentCode = d.documentCode;
      doc.documentLabel = d.documentLabel ?? null;
      doc.fileName = d.fileName;
      doc.fileUrl = d.fileUrl;
      doc.fileSizeBytes = d.fileSizeBytes ?? null;
      doc.mimeType = d.mimeType ?? null;
      doc.uploadedBy = userId;
      doc.uploadedAt = new Date();
      return doc;
    });
  }
}
