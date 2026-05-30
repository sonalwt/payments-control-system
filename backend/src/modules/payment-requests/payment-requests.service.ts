import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaymentRequest, PaymentRequestStatus } from './payment-request.entity';
import { PaymentRequestApproval } from './payment-request-approval.entity';
import { PaymentRequestDocument } from './payment-request-document.entity';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import {
  ApproveDto,
  CancelDto,
  MarkPaidDto,
  RejectDto,
  ReleaseDto,
  UploadProofDto,
  WithdrawDto,
} from './dto/action.dto';
import { BeneficiaryAccountsService } from '../beneficiary-accounts/beneficiary-accounts.service';
import { ApprovalMatrix } from '../approval-matrices/approval-matrix.entity';
import { ApprovalMatrixBand } from '../approval-matrices/approval-matrix-band.entity';
import { ApprovalMatrixStep } from '../approval-matrices/approval-matrix-step.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { Country } from '../countries/country.entity';
import { UserRole } from '../users/user-role.entity';
import { PaymentType } from '../payment-types/payment-type.entity';
import { User } from '../users/user.entity';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentRequestsService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly repo: Repository<PaymentRequest>,
    @InjectRepository(PaymentRequestDocument)
    private readonly docRepo: Repository<PaymentRequestDocument>,
    private readonly beneficiaryService: BeneficiaryAccountsService,
    private readonly dataSource: DataSource,
  ) {}

  // ===================================================================
  // CRUD
  // ===================================================================

  async create(dto: CreatePaymentRequestDto, actorId: string): Promise<PaymentRequest> {
    // SoW maker rule: only users who are configured as the Maker for the
    // chosen payment type (or SUPER_ADMIN) may create a request. Holding
    // only the Checker role does not grant create rights.
    await this.assertCanMake(actorId, dto.paymentTypeId);

    return this.dataSource.transaction(async (em) => {
      const requestNumber = await this.nextRequestNumber(em);
      const pr = em.create(PaymentRequest, {
        requestNumber,
        paymentTypeId: dto.paymentTypeId,
        legalEntityId: dto.legalEntityId,
        counterpartyId: dto.counterpartyId ?? null,
        employeeId: dto.employeeId ?? null,
        beneficiaryAccountId: dto.beneficiaryAccountId ?? null,
        sourceAccountId: dto.sourceAccountId ?? null,
        currencyId: dto.currencyId,
        amount: dto.amount,
        purposeDescription: dto.purposeDescription ?? null,
        invoiceNumber: dto.invoiceNumber ?? null,
        dueDate: dto.dueDate ?? null,
        status: 'DRAFT' as PaymentRequestStatus,
        createdBy: actorId,
        updatedBy: actorId,
      });
      const saved = await em.save(pr);

      if (dto.documents?.length) {
        for (const d of dto.documents) {
          const doc = em.create(PaymentRequestDocument, {
            paymentRequestId: saved.id,
            documentCode: d.documentCode,
            documentLabel: d.documentLabel ?? null,
            fileName: d.fileName,
            fileUrl: d.fileUrl,
            fileSizeBytes: d.fileSizeBytes ?? null,
            mimeType: d.mimeType ?? null,
            uploadedBy: actorId,
          });
          await em.save(doc);
        }
      }

      return this.loadOne(saved.id, em.getRepository(PaymentRequest));
    });
  }

  async findAll(
    query: PaginationQueryDto & { status?: string; legalEntityId?: string; paymentTypeId?: string },
  ): Promise<PaginatedResult<PaymentRequest>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.paymentType', 'paymentType')
      .leftJoinAndSelect('pr.legalEntity', 'legalEntity')
      .leftJoinAndSelect('pr.counterparty', 'counterparty')
      .leftJoinAndSelect('pr.employee', 'employee')
      .leftJoinAndSelect('pr.currency', 'currency')
      .leftJoinAndSelect('pr.beneficiaryAccount', 'beneficiaryAccount')
      .leftJoinAndSelect('beneficiaryAccount.bank', 'beneficiaryBank')
      .leftJoinAndSelect('pr.sourceAccount', 'sourceAccount')
      .orderBy('pr.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) qb.andWhere('pr.status = :status', { status: query.status });
    if (query.legalEntityId) qb.andWhere('pr.legal_entity_id = :le', { le: query.legalEntityId });
    if (query.paymentTypeId) qb.andWhere('pr.payment_type_id = :pt', { pt: query.paymentTypeId });
    if (search) {
      qb.andWhere(
        '(pr.request_number ILIKE :s OR pr.invoice_number ILIKE :s OR counterparty.legal_name ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findOne(id: string): Promise<PaymentRequest> {
    return this.loadOne(id, this.repo);
  }

  async update(id: string, dto: UpdatePaymentRequestDto, actorId: string): Promise<PaymentRequest> {
    const pr = await this.findOne(id);
    if (pr.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT payment requests can be edited.');
    }
    Object.assign(pr, {
      paymentTypeId: dto.paymentTypeId ?? pr.paymentTypeId,
      legalEntityId: dto.legalEntityId ?? pr.legalEntityId,
      counterpartyId: dto.counterpartyId ?? pr.counterpartyId,
      employeeId: dto.employeeId ?? pr.employeeId,
      beneficiaryAccountId: dto.beneficiaryAccountId ?? pr.beneficiaryAccountId,
      sourceAccountId: dto.sourceAccountId ?? pr.sourceAccountId,
      currencyId: dto.currencyId ?? pr.currencyId,
      amount: dto.amount ?? pr.amount,
      purposeDescription: dto.purposeDescription ?? pr.purposeDescription,
      invoiceNumber: dto.invoiceNumber ?? pr.invoiceNumber,
      dueDate: dto.dueDate ?? pr.dueDate,
      updatedBy: actorId,
    });
    return this.repo.save(pr);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const pr = await this.findOne(id);
    if (pr.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT payment requests can be deleted. Use withdraw/cancel for other statuses.');
    }
    pr.updatedBy = actorId;
    await this.repo.save(pr);
    await this.repo.softRemove(pr);
  }

  // ===================================================================
  // §3 Lifecycle actions
  // ===================================================================

  /**
   * §3 — Submit a DRAFT for approval.
   * - Validates the document policy of the payment type.
   * - Validates that the destination beneficiary is payable.
   * - Snapshots the matrix band matching (currency, amount) and creates
   *   one PaymentRequestApproval per step.
   * - Sets sanction_warning if the beneficiary's country is sanctioned.
   * - Freezes counterparty + beneficiary snapshots.
   */
  async submit(id: string, actorId: string): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, {
        where: { id },
        relations: ['paymentType', 'counterparty', 'beneficiaryAccount'],
      });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'DRAFT') {
        throw new BadRequestException(`Cannot submit in status ${pr.status}`);
      }

      // §4.1 — verify the required documents are attached.
      const docs = await em.find(PaymentRequestDocument, {
        where: { paymentRequestId: pr.id },
      });
      const policy = (pr.paymentType?.documentPolicy ?? []) as Array<{
        code: string;
        label: string;
        required: boolean;
      }>;
      const attachedCodes = new Set(docs.map((d) => d.documentCode));
      const missing = policy
        .filter((p) => p.required && !attachedCodes.has(p.code))
        .map((p) => p.code);
      if (missing.length) {
        throw new BadRequestException(
          `Missing required documents: ${missing.join(', ')}`,
        );
      }

      // §6 — destination beneficiary must be payable.
      if (pr.beneficiaryAccount) {
        if (!this.beneficiaryService.isPayable(pr.beneficiaryAccount)) {
          throw new BadRequestException(
            'Selected beneficiary account is not payable (inactive or within cooling-off).',
          );
        }

        // §6.5 — sanctioned country flag.
        const ben = pr.beneficiaryAccount;
        if (ben.countryId) {
          const country = await em.findOne(Country, { where: { id: ben.countryId } });
          if (country?.isSanctioned) {
            pr.sanctionWarning = true;
          }
        }

        pr.beneficiarySnapshot = this.snapshotBeneficiary(ben);
      }

      // §1.3/§4.2 — counterparty snapshot
      if (pr.counterparty) {
        pr.counterpartySnapshot = this.snapshotCounterparty(pr.counterparty);
      }

      // §1.5 — pick the published matrix that matches this payment type
      // and the request currency.
      const matrix = await em
        .createQueryBuilder(ApprovalMatrix, 'm')
        .where('m.payment_type_id = :pt', { pt: pr.paymentTypeId })
        .andWhere('m.currency_id = :ccy', { ccy: pr.currencyId })
        .andWhere("m.status = 'PUBLISHED'")
        .andWhere('m.deleted_at IS NULL')
        .orderBy('m.version', 'DESC')
        .getOne();
      if (!matrix) {
        throw new BadRequestException(
          'No published approval matrix exists for this payment type and currency.',
        );
      }

      // Find the band matching the request amount.
      const bands = await em.find(ApprovalMatrixBand, {
        where: { matrixId: matrix.id },
        order: { sortOrder: 'ASC' },
      });
      const amountNum = Number(pr.amount);
      const band = bands.find((b) => {
        const min = Number(b.minAmount);
        const max = b.maxAmount == null ? Infinity : Number(b.maxAmount);
        return amountNum >= min && amountNum <= max;
      });
      if (!band) {
        throw new BadRequestException(
          `Matrix has no band covering amount ${pr.amount}`,
        );
      }

      // Snapshot the chain.
      const steps = await em.find(ApprovalMatrixStep, {
        where: { bandId: band.id },
        order: { stepOrder: 'ASC' },
      });
      if (!steps.length) {
        throw new BadRequestException('Matched approval band has no steps.');
      }

      pr.matrixId = matrix.id;
      pr.matrixVersion = matrix.version;
      pr.currentStepOrder = 1;
      pr.status = 'PENDING_APPROVAL';
      pr.submittedAt = new Date();
      pr.updatedBy = actorId;
      await em.save(pr);

      // Renumber to dense 1..N regardless of source step_order gaps.
      let order = 1;
      for (const s of steps) {
        const ap = em.create(PaymentRequestApproval, {
          paymentRequestId: pr.id,
          stepOrder: order++,
          approverType: s.approverType,
          approverUserId: s.approverUserId ?? null,
          approverRoleId: s.approverRoleId ?? null,
          decision: 'PENDING',
        });
        await em.save(ap);
      }

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  /**
   * §3 — Record an approval at the current step. If this was the last
   * step, the request moves to APPROVED; otherwise to the next step.
   */
  async approve(id: string, dto: ApproveDto, actorId: string): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException(`Cannot approve in status ${pr.status}`);
      }
      const step = await em.findOne(PaymentRequestApproval, {
        where: { paymentRequestId: pr.id, stepOrder: pr.currentStepOrder ?? -1 },
      });
      if (!step) throw new BadRequestException('No active step found.');
      if (step.decision !== 'PENDING') {
        throw new BadRequestException('Active step has already been decided.');
      }

      // SoW §6.5: when sanction_warning is set, the final approver must
      // record an override reason before approval registers.
      const totalSteps = await em.count(PaymentRequestApproval, {
        where: { paymentRequestId: pr.id },
      });
      const isFinalStep = (pr.currentStepOrder ?? 0) === totalSteps;
      if (pr.sanctionWarning && isFinalStep && !dto.sanctionOverrideReason) {
        throw new BadRequestException(
          'sanctionOverrideReason is required to approve a request flagged against a sanctioned country.',
        );
      }

      // Authorisation: USER step requires exact match; ROLE step
      // requires the actor to hold the role.
      if (step.approverType === 'USER') {
        if (step.approverUserId !== actorId) {
          throw new ForbiddenException('This step is assigned to a different user.');
        }
      } else if (step.approverType === 'ROLE') {
        const has = await em.count(UserRole, {
          where: { userId: actorId, roleId: step.approverRoleId ?? '' },
        });
        if (!has) {
          throw new ForbiddenException('You do not hold the required role for this step.');
        }
      }

      step.decision = 'APPROVED';
      step.decidedBy = actorId;
      step.decidedAt = new Date();
      step.comments = dto.comments ?? null;
      await em.save(step);

      if (isFinalStep) {
        pr.status = 'APPROVED';
        pr.currentStepOrder = null;
        pr.approvedAt = new Date();
        if (dto.sanctionOverrideReason) pr.sanctionOverrideReason = dto.sanctionOverrideReason;
      } else {
        pr.currentStepOrder = (pr.currentStepOrder ?? 0) + 1;
      }
      pr.updatedBy = actorId;
      await em.save(pr);

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  async reject(id: string, dto: RejectDto, actorId: string): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException(`Cannot reject in status ${pr.status}`);
      }
      const step = await em.findOne(PaymentRequestApproval, {
        where: { paymentRequestId: pr.id, stepOrder: pr.currentStepOrder ?? -1 },
      });
      if (!step) throw new BadRequestException('No active step found.');

      if (step.approverType === 'USER') {
        if (step.approverUserId !== actorId) {
          throw new ForbiddenException('This step is assigned to a different user.');
        }
      } else if (step.approverType === 'ROLE') {
        const has = await em.count(UserRole, {
          where: { userId: actorId, roleId: step.approverRoleId ?? '' },
        });
        if (!has) {
          throw new ForbiddenException('You do not hold the required role for this step.');
        }
      }

      step.decision = 'REJECTED';
      step.decidedBy = actorId;
      step.decidedAt = new Date();
      step.comments = dto.comments;
      await em.save(step);

      pr.status = 'REJECTED';
      pr.currentStepOrder = null;
      pr.rejectionReason = dto.comments;
      pr.updatedBy = actorId;
      await em.save(pr);

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  async withdraw(id: string, dto: WithdrawDto, actorId: string): Promise<PaymentRequest> {
    const pr = await this.findOne(id);
    if (pr.status !== 'DRAFT' && pr.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot withdraw in status ${pr.status}`);
    }
    if (pr.createdBy !== actorId) {
      throw new ForbiddenException('Only the initiator can withdraw their request.');
    }
    pr.status = 'WITHDRAWN';
    pr.currentStepOrder = null;
    pr.withdrawnReason = dto.reason ?? null;
    pr.updatedBy = actorId;
    return this.repo.save(pr);
  }

  /** §4.3 — Maker releases an APPROVED request to the bank. */
  async release(id: string, dto: ReleaseDto, actorId: string): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'APPROVED') {
        throw new BadRequestException(`Cannot release in status ${pr.status}`);
      }

      const acc = await em.findOne(BankAccount, { where: { id: dto.sourceAccountId } });
      if (!acc) throw new NotFoundException('Source account not found.');

      // §2.5 minimum-balance control (basic, same-currency only)
      if (acc.currencyId !== pr.currencyId) {
        throw new BadRequestException(
          'Cross-currency release is not supported in the MVP. Select a source account in the request currency.',
        );
      }
      const remaining = Number(acc.remainingBalance);
      const minimum = Number(acc.minimumBalance);
      const amount = Number(pr.amount);
      if (remaining - amount < minimum) {
        throw new BadRequestException(
          'Releasing this payment would push the source account below its minimum balance.',
        );
      }

      pr.sourceAccountId = dto.sourceAccountId;
      pr.status = 'AWAITING_PAYMENT_CONFIRMATION';
      pr.releasedAt = new Date();
      pr.updatedBy = actorId;
      await em.save(pr);

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  /** §4.4 — Maker captures bank reference + value date → PAID. */
  async markPaid(id: string, dto: MarkPaidDto, actorId: string): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'AWAITING_PAYMENT_CONFIRMATION') {
        throw new BadRequestException(`Cannot mark paid in status ${pr.status}`);
      }

      // Debit the source account's remaining balance on PAID (§2.5).
      if (pr.sourceAccountId) {
        const acc = await em.findOne(BankAccount, { where: { id: pr.sourceAccountId } });
        if (acc) {
          acc.remainingBalance = Number(acc.remainingBalance) - Number(pr.amount);
          await em.save(acc);
        }
      }

      pr.bankReference = dto.bankReference;
      pr.valueDate = dto.valueDate;
      pr.status = 'PAID';
      pr.paidAt = new Date();
      pr.updatedBy = actorId;
      await em.save(pr);

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  async uploadProof(id: string, dto: UploadProofDto, actorId: string): Promise<PaymentRequest> {
    const pr = await this.findOne(id);
    if (pr.status !== 'PAID' && pr.status !== 'AWAITING_PAYMENT_CONFIRMATION') {
      throw new BadRequestException(`Cannot upload proof in status ${pr.status}`);
    }
    pr.proofOfPaymentUrl = dto.proofOfPaymentUrl;
    pr.updatedBy = actorId;
    return this.repo.save(pr);
  }

  /** Administrative cancel — any non-terminal status. */
  async cancel(id: string, dto: CancelDto, actorId: string): Promise<PaymentRequest> {
    const pr = await this.findOne(id);
    if (pr.status === 'PAID' || pr.status === 'CANCELLED' || pr.status === 'REJECTED' || pr.status === 'WITHDRAWN') {
      throw new BadRequestException(`Cannot cancel in status ${pr.status}`);
    }
    pr.status = 'CANCELLED';
    pr.currentStepOrder = null;
    pr.cancellationReason = dto.reason;
    pr.updatedBy = actorId;
    return this.repo.save(pr);
  }

  // ===================================================================
  // Documents
  // ===================================================================

  async attachDocument(
    id: string,
    dto: {
      documentCode: string;
      documentLabel?: string | null;
      fileName: string;
      fileUrl: string;
      mimeType?: string | null;
      fileSizeBytes?: number | null;
    },
    actorId: string,
  ): Promise<PaymentRequestDocument> {
    const pr = await this.findOne(id);
    if (pr.status !== 'DRAFT') {
      throw new BadRequestException('Documents can only be attached in DRAFT.');
    }
    const doc = this.docRepo.create({
      paymentRequestId: pr.id,
      documentCode: dto.documentCode,
      documentLabel: dto.documentLabel ?? null,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      mimeType: dto.mimeType ?? null,
      fileSizeBytes: dto.fileSizeBytes ?? null,
      uploadedBy: actorId,
    });
    return this.docRepo.save(doc);
  }

  async removeDocument(id: string, documentId: string, _actorId: string): Promise<void> {
    const pr = await this.findOne(id);
    if (pr.status !== 'DRAFT') {
      throw new BadRequestException('Documents can only be removed in DRAFT.');
    }
    const doc = await this.docRepo.findOne({ where: { id: documentId, paymentRequestId: pr.id } });
    if (!doc) throw new NotFoundException('Document not found.');
    await this.docRepo.remove(doc);
  }

  // ===================================================================
  // Private helpers
  // ===================================================================

  /**
   * Maker-eligibility check. A user may act as Maker for a payment
   * type when they are SUPER_ADMIN, OR they are the payment type's
   * named maker_user_id, OR they hold the payment type's
   * maker_role_id. Holding only the Checker role does not count.
   *
   * Throws ForbiddenException when the actor does not qualify.
   */
  private async assertCanMake(actorId: string, paymentTypeId: string): Promise<void> {
    const ptRepo = this.dataSource.getRepository(PaymentType);
    const pt = await ptRepo.findOne({
      where: { id: paymentTypeId },
      select: ['id', 'code', 'name', 'makerRoleId', 'makerUserId'],
    });
    if (!pt) throw new NotFoundException(`Payment type ${paymentTypeId} not found`);

    // Platform-admin / SUPER_ADMIN bypass.
    const userRow = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: actorId }, select: ['id', 'isPlatformAdmin'] });
    if (userRow?.isPlatformAdmin) return;
    const hasSuperAdmin = await this.dataSource
      .getRepository(UserRole)
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'r')
      .where('ur.user_id = :uid', { uid: actorId })
      .andWhere('r.code = :code', { code: 'SUPER_ADMIN' })
      .getCount();
    if (hasSuperAdmin > 0) return;

    // Named-user maker match.
    if (pt.makerUserId && pt.makerUserId === actorId) return;

    // Role-based maker match.
    if (pt.makerRoleId) {
      const has = await this.dataSource
        .getRepository(UserRole)
        .count({ where: { userId: actorId, roleId: pt.makerRoleId } });
      if (has > 0) return;
    }

    throw new ForbiddenException(
      `You are not configured as the Maker for "${pt.name}" (${pt.code}). Only users holding the maker role (or named as maker) may create requests for this payment type.`,
    );
  }

  private async loadOne(id: string, repo: Repository<PaymentRequest>): Promise<PaymentRequest> {
    const pr = await repo
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.paymentType', 'paymentType')
      .leftJoinAndSelect('pr.legalEntity', 'legalEntity')
      .leftJoinAndSelect('pr.counterparty', 'counterparty')
      .leftJoinAndSelect('pr.employee', 'employee')
      .leftJoinAndSelect('pr.currency', 'currency')
      .leftJoinAndSelect('pr.beneficiaryAccount', 'beneficiaryAccount')
      .leftJoinAndSelect('beneficiaryAccount.bank', 'beneficiaryBank')
      .leftJoinAndSelect('beneficiaryAccount.country', 'beneficiaryCountry')
      .leftJoinAndSelect('pr.sourceAccount', 'sourceAccount')
      .leftJoinAndSelect('pr.approvals', 'approval')
      .leftJoinAndSelect('approval.approverUser', 'approverUser')
      .leftJoinAndSelect('approval.approverRole', 'approverRole')
      .leftJoinAndSelect('approval.decidedByUser', 'decidedByUser')
      .leftJoinAndSelect('pr.documents', 'document')
      .where('pr.id = :id', { id })
      .orderBy('approval.step_order', 'ASC')
      .addOrderBy('document.uploaded_at', 'ASC')
      .getOne();
    if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
    return pr;
  }

  private async nextRequestNumber(em: { query: (s: string) => Promise<unknown> }): Promise<string> {
    const rows = (await em.query("SELECT nextval('payment_request_seq') AS n")) as Array<{ n: string }>;
    const seq = Number(rows[0].n);
    const year = new Date().getUTCFullYear();
    return `PR-${year}-${String(seq).padStart(5, '0')}`;
  }

  private snapshotCounterparty(cp: Counterparty): Record<string, unknown> {
    return {
      id: cp.id,
      legalName: (cp as unknown as { legalName?: string; name?: string }).legalName ??
        (cp as unknown as { name?: string }).name,
      countryId: (cp as unknown as { countryId?: string }).countryId,
      taxId: (cp as unknown as { taxId?: string }).taxId,
    };
  }

  private snapshotBeneficiary(b: { id: string; accountHolderName: string; accountNumber: string; bankId: string; countryId: string; currencyId: string; iban?: string | null; swiftBic?: string | null }): Record<string, unknown> {
    return {
      id: b.id,
      accountHolderName: b.accountHolderName,
      accountNumber: b.accountNumber,
      bankId: b.bankId,
      countryId: b.countryId,
      currencyId: b.currencyId,
      iban: b.iban ?? null,
      swiftBic: b.swiftBic ?? null,
    };
  }
}
