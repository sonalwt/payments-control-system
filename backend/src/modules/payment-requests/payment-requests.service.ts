import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import {
  PaymentRequest,
  PaymentRequestStatus,
} from './payment-request.entity';
import { PaymentRequestApproval } from './payment-request-approval.entity';
import { PaymentRequestDocument } from './payment-request-document.entity';
import { PaymentRequestsRepository } from './payment-requests.repository';
import { CreatePaymentRequestDto, DocumentAttachmentDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import {
  ApprovePaymentRequestDto,
  CancelPaymentRequestDto,
  MarkPaidDto,
  RejectPaymentRequestDto,
  ReleasePaymentRequestDto,
  WithdrawPaymentRequestDto,
} from './dto/action.dto';
import { ApprovalMatricesService } from '../approval-matrices/approval-matrices.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface PaymentRequestQuery extends PaginationQueryDto {
  status?: PaymentRequestStatus;
  paymentTypeCode?: string;
  legalEntityId?: string;
  counterpartyId?: string;
  employeeId?: string;
}

/** Non-terminal statuses that may still be acted on. */
const ACTIVE_STATUSES: PaymentRequestStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'AWAITING_PAYMENT_CONFIRMATION',
];

@Injectable()
export class PaymentRequestsService {
  constructor(
    private readonly repo: PaymentRequestsRepository,
    private readonly approvalMatricesService: ApprovalMatricesService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  async create(dto: CreatePaymentRequestDto, userId: string): Promise<PaymentRequest> {
    const requestNumber = await this.generateRequestNumber();

    const entity = this.repo.create({
      requestNumber,
      paymentTypeCode: dto.paymentTypeCode,
      legalEntityId: dto.legalEntityId,
      counterpartyId: dto.counterpartyId ?? null,
      employeeId: dto.employeeId ?? null,
      beneficiaryAccountId: dto.beneficiaryAccountId ?? null,
      currencyCode: dto.currencyCode,
      amount: dto.amount,
      amountMinor: dto.amountMinor,
      purposeDescription: dto.purposeDescription ?? null,
      invoiceNumber: dto.invoiceNumber ?? null,
      dueDate: dto.dueDate ?? null,
      status: 'DRAFT',
      isCrossCurrency: false,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.repo.save(entity);

    if (dto.documents && dto.documents.length > 0) {
      const docs = this.buildDocuments(dto.documents, saved.id, userId);
      await this.repo.saveDocuments(docs);
    }

    return this.requireById(saved.id, true);
  }

  async findAll(query: PaymentRequestQuery): Promise<PaginatedResult<PaymentRequest>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentTypeCode,
      legalEntityId,
      counterpartyId,
      employeeId,
    } = query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (paymentTypeCode) where.paymentTypeCode = paymentTypeCode;
    if (legalEntityId) where.legalEntityId = legalEntityId;
    if (counterpartyId) where.counterpartyId = counterpartyId;
    if (employeeId) where.employeeId = employeeId;

    const baseWhere = search
      ? [
          { ...where, requestNumber: ILike(`%${search}%`) },
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
        employee: true,
        sourceAccount: { bank: true, currency: true },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<PaymentRequest> {
    return this.requireById(id, true);
  }

  async update(
    id: string,
    dto: UpdatePaymentRequestDto,
    userId: string,
  ): Promise<PaymentRequest> {
    const pr = await this.requireById(id);
    this.assertStatus(pr, 'DRAFT', 'edit');

    if (dto.paymentTypeCode !== undefined) pr.paymentTypeCode = dto.paymentTypeCode;
    if (dto.counterpartyId !== undefined) pr.counterpartyId = dto.counterpartyId ?? null;
    if (dto.employeeId !== undefined) pr.employeeId = dto.employeeId ?? null;
    if (dto.currencyCode !== undefined) pr.currencyCode = dto.currencyCode;
    if (dto.amount !== undefined) pr.amount = dto.amount;
    if (dto.amountMinor !== undefined) pr.amountMinor = dto.amountMinor;
    if (dto.purposeDescription !== undefined)
      pr.purposeDescription = dto.purposeDescription ?? null;
    if ((dto as any).invoiceNumber !== undefined)
      pr.invoiceNumber = (dto as any).invoiceNumber ?? null;
    if ((dto as any).dueDate !== undefined)
      pr.dueDate = (dto as any).dueDate ?? null;
    pr.updatedBy = userId;

    await this.repo.save(pr);

    if (dto.documents && dto.documents.length > 0) {
      const docs = this.buildDocuments(dto.documents, id, userId);
      await this.repo.saveDocuments(docs);
    }

    return this.requireById(id, true);
  }

  async remove(id: string, userId: string): Promise<void> {
    const pr = await this.requireById(id);
    this.assertStatus(pr, 'DRAFT', 'delete');
    pr.updatedBy = userId;
    await this.repo.save(pr);
    await this.repo.softRemove(pr);
  }

  // -----------------------------------------------------------------------
  // §3 — Status transitions
  // -----------------------------------------------------------------------

  /**
   * DRAFT → PENDING_APPROVAL
   * Resolves the approval chain from the published matrix, creates approval
   * step records, and pins the matrix version so in-flight requests are
   * unaffected by subsequent matrix changes (§1.5).
   */
  async submit(id: string, userId: string): Promise<PaymentRequest> {
    const pr = await this.requireById(id, true);
    this.assertStatus(pr, 'DRAFT', 'submit');

    // §4.1 — Enforce threshold-based document policy before allowing submission.
    const documentPolicy = await this.repo.findDocumentPolicyByPaymentType(pr.paymentTypeCode);
    if (documentPolicy.length > 0) {
      const attachedCodes = new Set((pr.documents ?? []).map((d) => d.documentCode));
      const missing: string[] = [];
      for (const item of documentPolicy) {
        const requiredByThreshold =
          item.amountThresholdMinor != null && pr.amountMinor >= item.amountThresholdMinor;
        if ((item.required || requiredByThreshold) && !attachedCodes.has(item.code)) {
          missing.push(`"${item.label}" (${item.code})`);
        }
      }
      if (missing.length > 0) {
        throw new BadRequestException(
          `The following required document(s) must be attached before submitting: ${missing.join(', ')}.`,
        );
      }
    }

    // §6 — Beneficiary account must be ACTIVE before a payment request can
    // be submitted. PENDING_ACTIVATION (cooling-off) and INACTIVE accounts
    // are not permitted as payment destinations.
    if (pr.beneficiaryAccount && pr.beneficiaryAccount.status !== 'ACTIVE') {
      throw new BadRequestException(
        `The selected beneficiary account is in status "${pr.beneficiaryAccount.status}" and cannot be used until it is ACTIVE.`,
      );
    }

    // §6.5/§4.2 — Check whether the beneficiary or counterparty country is
    // sanctioned and flag the request for approver visibility.
    const countriesToCheck = [
      pr.beneficiaryAccount?.countryCode,
      pr.counterparty?.countryCode,
      (pr.employee as any)?.countryCode,
    ].filter((c): c is string => !!c);

    let sanctionWarning = false;
    for (const code of countriesToCheck) {
      if (await this.repo.isSanctionedCountry(code)) {
        sanctionWarning = true;
        break;
      }
    }
    pr.sanctionWarning = sanctionWarning;

    const asOfDate = new Date().toISOString().slice(0, 10);
    const needsChain = await this.repo.paymentTypeRequiresApprovalChain(pr.paymentTypeCode);
    const chain = needsChain
      ? await this.approvalMatricesService.resolveChain({
          paymentTypeCode: pr.paymentTypeCode,
          currencyCode: pr.currencyCode,
          amountMinor: pr.amountMinor,
          asOfDate,
        })
      : { matrixId: null as string | null, version: null as number | null, steps: [] };

    const approvals: PaymentRequestApproval[] = chain.steps.map((step) => {
      const a = new PaymentRequestApproval();
      a.paymentRequestId = pr.id;
      a.stepOrder = step.stepOrder;
      a.approverType = step.approverType;
      a.approverUserId = step.approverUserId ?? null;
      a.approverRoleId = step.approverRoleId ?? null;
      a.isOptional = step.isOptional;
      a.decision = 'PENDING';
      return a;
    });

    await this.repo.saveApprovals(approvals);

    // §4.1/4.2 — Freeze counterparty / beneficiary data into immutable snapshots.
    if (pr.counterparty) {
      pr.counterpartySnapshot = {
        id: pr.counterparty.id,
        name: (pr.counterparty as any).name ?? null,
        role: (pr.counterparty as any).role ?? null,
        countryCode: (pr.counterparty as any).countryCode ?? null,
        primaryContactName: (pr.counterparty as any).primaryContactName ?? null,
        primaryContactEmail: (pr.counterparty as any).primaryContactEmail ?? null,
        primaryContactPhone: (pr.counterparty as any).primaryContactPhone ?? null,
        taxIdentifiers: (pr.counterparty as any).taxIdentifiers ?? null,
        capturedAt: new Date().toISOString(),
      };
    } else if (pr.employee) {
      pr.counterpartySnapshot = {
        id: (pr.employee as any).id,
        fullName: (pr.employee as any).fullName ?? null,
        employeeCode: (pr.employee as any).employeeCode ?? null,
        payrollCategory: (pr.employee as any).payrollCategory ?? null,
        countryCode: (pr.employee as any).countryCode ?? null,
        capturedAt: new Date().toISOString(),
      };
    }
    if (pr.beneficiaryAccount) {
      pr.beneficiarySnapshot = {
        id: pr.beneficiaryAccount.id,
        accountHolderName: pr.beneficiaryAccount.accountHolderName,
        accountNumber: pr.beneficiaryAccount.accountNumber,
        bankName: pr.beneficiaryAccount.bankName ?? (pr.beneficiaryAccount.bank as any)?.name ?? null,
        swiftBic: pr.beneficiaryAccount.swiftBic ?? null,
        iban: pr.beneficiaryAccount.iban ?? null,
        countryCode: pr.beneficiaryAccount.countryCode,
        currencyCode: (pr.beneficiaryAccount.currency as any)?.code ?? null,
        accountDirection: pr.beneficiaryAccount.accountDirection ?? 'PAY_TO',
        capturedAt: new Date().toISOString(),
      };
    }

    // §4.1 — Auto-attach counterparty/employee snapshot as a downloadable
    // audit document so approvers can review the frozen data without
    // navigating away from the approval screen.
    if (pr.counterpartySnapshot) {
      const label = pr.counterparty ? 'Counterparty Data Snapshot' : 'Employee Data Snapshot';
      const snapshotDoc = new PaymentRequestDocument();
      snapshotDoc.paymentRequestId = pr.id;
      snapshotDoc.documentCode = 'COUNTERPARTY_SNAPSHOT';
      snapshotDoc.documentLabel = label;
      snapshotDoc.fileName = `snapshot_${pr.requestNumber}.json`;
      // Virtual endpoint — the snapshot JSONB is served by the controller.
      snapshotDoc.fileUrl = `/api/payment-requests/${pr.id}/counterparty-snapshot`;
      snapshotDoc.mimeType = 'application/json';
      snapshotDoc.uploadedBy = userId;
      snapshotDoc.uploadedAt = new Date();
      await this.repo.saveDocuments([snapshotDoc]);
    }

    pr.status = 'PENDING_APPROVAL';
    pr.submittedAt = new Date();
    pr.matrixId = chain.matrixId;
    pr.matrixVersion = chain.version;
    pr.currentStepOrder = chain.steps.length > 0 ? 1 : null;
    pr.updatedBy = userId;

    // If there are no approval steps (e.g. payment type with no chain), go directly to APPROVED.
    if (chain.steps.length === 0) {
      pr.status = 'APPROVED';
      pr.approvedAt = new Date();
      pr.currentStepOrder = null;
    }

    return this.repo.save(pr);
  }

  /**
   * Approve the current pending step.
   * If this was the last required step, the request moves to APPROVED.
   */
  async approve(
    id: string,
    userId: string,
    dto: ApprovePaymentRequestDto,
  ): Promise<PaymentRequest> {
    const pr = await this.requireById(id, true);
    if (pr.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `Request must be in PENDING_APPROVAL status to approve (current: ${pr.status}).`,
      );
    }

    const currentStep = (pr.approvals ?? []).find(
      (a) => a.stepOrder === pr.currentStepOrder && a.decision === 'PENDING',
    );
    if (!currentStep) {
      throw new BadRequestException('No pending approval step found at the current step order.');
    }

    await this.assertCanActOnStep(currentStep, userId, pr.legalEntityId);

    currentStep.decision = 'APPROVED';
    currentStep.decidedBy = userId;
    currentStep.decidedAt = new Date();
    currentStep.comments = dto.comments ?? null;
    await this.repo.saveApproval(currentStep);

    // Advance to the next pending (non-optional or next required) step.
    const remaining = (pr.approvals ?? [])
      .filter((a) => a.stepOrder > pr.currentStepOrder! && a.decision === 'PENDING')
      .sort((a, b) => a.stepOrder - b.stepOrder);

    if (remaining.length > 0) {
      pr.currentStepOrder = remaining[0].stepOrder;
    } else {
      pr.status = 'APPROVED';
      pr.approvedAt = new Date();
      pr.currentStepOrder = null;
    }

    pr.updatedBy = userId;
    return this.repo.save(pr);
  }

  /** Any approver in the current step may reject, moving the request to REJECTED. */
  async reject(
    id: string,
    userId: string,
    dto: RejectPaymentRequestDto,
  ): Promise<PaymentRequest> {
    const pr = await this.requireById(id, true);
    if (pr.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `Request must be in PENDING_APPROVAL status to reject (current: ${pr.status}).`,
      );
    }

    const currentStep = (pr.approvals ?? []).find(
      (a) => a.stepOrder === pr.currentStepOrder && a.decision === 'PENDING',
    );
    if (!currentStep) {
      throw new BadRequestException('No pending approval step found.');
    }

    await this.assertCanActOnStep(currentStep, userId, pr.legalEntityId);

    currentStep.decision = 'REJECTED';
    currentStep.decidedBy = userId;
    currentStep.decidedAt = new Date();
    currentStep.comments = dto.reason;
    await this.repo.saveApproval(currentStep);

    pr.status = 'REJECTED';
    pr.rejectionReason = dto.reason;
    pr.currentStepOrder = null;
    pr.updatedBy = userId;
    return this.repo.save(pr);
  }

  /** Requester withdraws the request (non-terminal statuses only). */
  async withdraw(
    id: string,
    userId: string,
    dto: WithdrawPaymentRequestDto,
  ): Promise<PaymentRequest> {
    const pr = await this.requireById(id);
    this.assertNonTerminal(pr, 'withdraw');

    pr.status = 'WITHDRAWN';
    pr.cancellationReason = dto.reason ?? null;
    pr.currentStepOrder = null;
    pr.updatedBy = userId;
    return this.repo.save(pr);
  }

  /** Admin cancels the request (non-terminal statuses only). */
  async cancel(
    id: string,
    userId: string,
    dto: CancelPaymentRequestDto,
  ): Promise<PaymentRequest> {
    const pr = await this.requireById(id);
    this.assertNonTerminal(pr, 'cancel');

    pr.status = 'CANCELLED';
    pr.cancellationReason = dto.reason;
    pr.currentStepOrder = null;
    pr.updatedBy = userId;
    return this.repo.save(pr);
  }

  /**
   * Maker releases the payment to the bank.
   * APPROVED → AWAITING_PAYMENT_CONFIRMATION.
   * Validates minimum-balance before releasing (§2.5).
   */
  async release(
    id: string,
    userId: string,
    dto: ReleasePaymentRequestDto,
  ): Promise<PaymentRequest> {
    const pr = await this.requireById(id);
    this.assertStatus(pr, 'APPROVED', 'release');

    // The debit amount for the minimum-balance check:
    // for cross-currency payments use the indicative source-currency equivalent.
    const debitForCheck =
      dto.isCrossCurrency && dto.indicativeSourceAmount
        ? dto.indicativeSourceAmount
        : pr.amount;

    await this.bankAccountsService.assertMinimumBalance(dto.sourceAccountId, debitForCheck);

    pr.status = 'AWAITING_PAYMENT_CONFIRMATION';
    pr.sourceAccountId = dto.sourceAccountId;
    pr.isCrossCurrency = dto.isCrossCurrency ?? false;
    pr.indicativeSourceAmount = dto.indicativeSourceAmount ?? null;
    pr.makerNotes = dto.makerNotes ?? null;
    pr.updatedBy = userId;
    return this.repo.save(pr);
  }

  /**
   * Maker marks payment as executed.
   * AWAITING_PAYMENT_CONFIRMATION → PAID.
   * Debits the source account balance (§2.5).
   */
  async markPaid(
    id: string,
    userId: string,
    dto: MarkPaidDto,
  ): Promise<PaymentRequest> {
    const pr = await this.requireById(id);
    this.assertStatus(pr, 'AWAITING_PAYMENT_CONFIRMATION', 'mark as paid');

    if (!pr.sourceAccountId) {
      throw new BadRequestException('Source account has not been set. Release the payment first.');
    }

    // Use the indicative source amount for cross-currency debits; actual payment
    // amount otherwise.  Post-execution corrections are handled separately (§2.6).
    const debitAmount =
      pr.isCrossCurrency && pr.indicativeSourceAmount
        ? pr.indicativeSourceAmount
        : pr.amount;

    await this.bankAccountsService.debitForPayment({
      accountId: pr.sourceAccountId,
      amount: debitAmount,
      reason: `Payment request ${pr.requestNumber}`,
      paymentRequestId: pr.id,
      userId,
    });

    pr.status = 'PAID';
    pr.bankReference = dto.bankReference;
    pr.valueDate = dto.valueDate;
    pr.proofOfPaymentUrl = dto.proofOfPaymentUrl ?? null;
    pr.paidAt = new Date();
    pr.updatedBy = userId;
    return this.repo.save(pr);
  }

  /**
   * §4.1 — Return the counterparty/employee snapshot frozen at submission.
   * Served as a JSON download via the virtual URL stored in the snapshot document.
   */
  async getCounterpartySnapshot(id: string): Promise<Record<string, unknown>> {
    const pr = await this.requireById(id, false);
    if (!pr.counterpartySnapshot) {
      throw new NotFoundException(`No counterparty snapshot found for payment request ${id}.`);
    }
    return pr.counterpartySnapshot;
  }

  /** Return the approval steps for a request (for the approval chain view). */
  async getApprovals(id: string): Promise<PaymentRequestApproval[]> {
    await this.requireById(id); // existence check
    return this.repo.findApprovals(id);
  }

  /** Return the documents attached to a request. */
  async getDocuments(id: string): Promise<PaymentRequestDocument[]> {
    await this.requireById(id);
    return this.repo.findDocuments(id);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private async requireById(id: string, withRelations = false): Promise<PaymentRequest> {
    const pr = await this.repo.findOneById(id, withRelations);
    if (!pr) throw new NotFoundException(`Payment request ${id} not found.`);
    return pr;
  }

  private assertStatus(
    pr: PaymentRequest,
    required: PaymentRequestStatus,
    action: string,
  ): void {
    if (pr.status !== required) {
      throw new BadRequestException(
        `Cannot ${action} a request in ${pr.status} status (required: ${required}).`,
      );
    }
  }

  private assertNonTerminal(pr: PaymentRequest, action: string): void {
    if (!ACTIVE_STATUSES.includes(pr.status)) {
      throw new BadRequestException(
        `Cannot ${action} a request that is already in terminal status ${pr.status}.`,
      );
    }
  }

  /**
   * Verify the acting user is permitted to act on this step:
   *  - USER step   → userId must match approverUserId
   *  - ROLE step   → user must hold the approverRoleId in the legal entity
   */
  private async assertCanActOnStep(
    step: PaymentRequestApproval,
    userId: string,
    legalEntityId: string,
  ): Promise<void> {
    if (step.approverType === 'USER') {
      if (step.approverUserId !== userId) {
        throw new ForbiddenException(
          'You are not the designated approver for this step.',
        );
      }
    } else {
      if (!step.approverRoleId) {
        throw new BadRequestException('Approval step has no role assigned.');
      }
      const hasRole = await this.repo.userHasRoleInEntity(
        userId,
        step.approverRoleId,
        legalEntityId,
      );
      if (!hasRole) {
        throw new ForbiddenException(
          'You do not hold the required role in this legal entity to approve this step.',
        );
      }
    }
  }

  private async generateRequestNumber(): Promise<string> {
    const seq = await this.repo.nextSequenceValue();
    const year = new Date().getFullYear();
    return `PR-${year}-${String(seq).padStart(5, '0')}`;
  }

  private buildDocuments(
    dtos: DocumentAttachmentDto[],
    paymentRequestId: string,
    userId: string,
  ): PaymentRequestDocument[] {
    return dtos.map((d) => {
      const doc = new PaymentRequestDocument();
      doc.paymentRequestId = paymentRequestId;
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
