import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RoleCode } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  dubaiDayRangeUtc,
  dubaiMonthStart,
  dubaiToday,
  dubaiYear,
} from '../../common/utils/datetime';
import { PaymentRequest, PaymentRequestStatus } from './payment-request.entity';
import { PaymentRequestApproval } from './payment-request-approval.entity';
import { PaymentRequestDocument } from './payment-request-document.entity';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import {
  ApproveDto,
  CancelDto,
  RejectDto,
  TreasuryDecisionDto,
  TreasurySubmitDto,
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
import { S3Service } from '../uploads/s3.service';

@Injectable()
export class PaymentRequestsService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly repo: Repository<PaymentRequest>,
    @InjectRepository(PaymentRequestDocument)
    private readonly docRepo: Repository<PaymentRequestDocument>,
    private readonly beneficiaryService: BeneficiaryAccountsService,
    private readonly dataSource: DataSource,
    private readonly s3: S3Service,
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
    query: PaginationQueryDto & {
      status?: string;
      paymentTypeId?: string;
      // Activity-date filter (filters on *when someone worked on* the request).
      activityPeriod?: 'today' | 'month' | string;
      dateFrom?: string;
      dateTo?: string;
      // When 'true', return only requests awaiting the viewer's action now
      // (their active approval step, or a treasury stage they own).
      awaitingAction?: string;
    },
    viewer?: AuthenticatedUser,
  ): Promise<PaginatedResult<PaymentRequest>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.paymentType', 'paymentType')
      .leftJoinAndSelect('paymentType.legalEntity', 'legalEntity')
      .leftJoinAndSelect('pr.counterparty', 'counterparty')
      .leftJoinAndSelect('pr.employee', 'employee')
      .leftJoinAndSelect('pr.currency', 'currency')
      .leftJoinAndSelect('pr.beneficiaryAccount', 'beneficiaryAccount')
      .leftJoinAndSelect('beneficiaryAccount.bank', 'beneficiaryBank')
      .leftJoinAndSelect('pr.sourceAccount', 'sourceAccount')
      // Actors that worked on the request: the maker (created_by) plus the
      // approval chain (each approver and who decided each step). Used by the
      // "Worked on by" column and the role-based scoping below.
      .leftJoinAndMapOne(
        'pr.createdByUser',
        User,
        'createdByUser',
        'createdByUser.id = pr.created_by',
      )
      .leftJoinAndSelect('pr.approvals', 'approval')
      .leftJoinAndSelect('approval.approverUser', 'approverUser')
      .leftJoinAndSelect('approval.approverRole', 'approverRole')
      .leftJoinAndSelect('approval.decidedByUser', 'decidedByUser')
      .orderBy('pr.createdAt', 'DESC')
      .addOrderBy('approval.stepOrder', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) qb.andWhere('pr.status = :status', { status: query.status });
    if (query.paymentTypeId) qb.andWhere('pr.payment_type_id = :pt', { pt: query.paymentTypeId });
    if (search) {
      qb.andWhere(
        '(pr.request_number ILIKE :s OR pr.invoice_number ILIKE :s OR counterparty.legal_name ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    // Role-based visibility — works with any custom role codes in the DB.
    // No hardcoded role enum values are used here. Auto-scoped to the viewer:
    // they see requests they (or their roles) have worked on or are assigned to.
    if (viewer) {
      const orClauses: string[] = [];
      const params: Record<string, unknown> = { viewerId: viewer.id };

      // (1) Creator always sees their own requests at any status (incl. the
      //     treasury stages, so they can track execution / handle rejects).
      orClauses.push('pr.created_by = :viewerId');

      // (2) Approver visibility: any step in the chain assigned to one of the
      //     viewer's roles or their user ID, OR a step the viewer personally
      //     decided. Covers both the live queue (PENDING steps awaiting them)
      //     and history (steps they already actioned). Handles ROLE and USER
      //     step types.
      if (viewer.roles.length > 0) {
        orClauses.push(`EXISTS (
          SELECT 1 FROM payment_request_approvals pra2
          LEFT JOIN roles rl ON rl.id = pra2.approver_role_id
          WHERE pra2.payment_request_id = pr.id
            AND (pra2.approver_user_id = :viewerId
                 OR pra2.decided_by = :viewerId
                 OR rl.code IN (:...viewerRoles))
        )`);
        params.viewerRoles = viewer.roles;
      } else {
        // USER-type approver with no assigned roles: match by user ID only.
        orClauses.push(`EXISTS (
          SELECT 1 FROM payment_request_approvals pra2
          WHERE pra2.payment_request_id = pr.id
            AND (pra2.approver_user_id = :viewerId OR pra2.decided_by = :viewerId)
        )`);
      }

      // (3) Treasury visibility: a treasury maker / checker / authoriser sees
      //     the requests currently awaiting their stage (the maker stage is
      //     split by the request's TT mode), plus any treasury stage they have
      //     already actioned. Treasury actors are NOT part of the approval
      //     chain, so without this they would never see their queue.
      const tRoles = viewer.roles ?? [];
      if (tRoles.includes('TREASURY_MAKER_ONLINE')) {
        // Online maker also covers legacy rows with no tt_mode (→ online).
        orClauses.push(`(pr.status = 'TREASURY_MAKER' AND pr.tt_mode IS DISTINCT FROM 'OFFLINE_TT')`);
      }
      if (tRoles.includes('TREASURY_MAKER_OFFLINE')) {
        orClauses.push(`(pr.status = 'TREASURY_MAKER' AND pr.tt_mode = 'OFFLINE_TT')`);
      }
      if (tRoles.includes('TREASURY_CHECKER')) {
        orClauses.push(`(pr.status = 'TREASURY_CHECKER')`);
      }
      if (tRoles.includes('TREASURY_AUTHORISER')) {
        orClauses.push(`(pr.status = 'TREASURY_AUTHORISER')`);
      }
      orClauses.push(
        `(pr.treasury_maker_by = :viewerId OR pr.treasury_checker_by = :viewerId OR pr.treasury_authoriser_by = :viewerId)`,
      );

      qb.andWhere(`(${orClauses.join(' OR ')})`, params);

      // "Needs your attention" — narrow to requests awaiting THIS viewer's
      // action right now: the active (PENDING) approval step assigned to them,
      // or a treasury stage they own (maker stage split by TT mode).
      if (query.awaitingAction === 'true') {
        const aw: string[] = [];
        const awParams: Record<string, unknown> = { viewerId: viewer.id };
        if (viewer.roles.length > 0) {
          aw.push(`(pr.status = 'PENDING_APPROVAL' AND EXISTS (
            SELECT 1 FROM payment_request_approvals praA
            LEFT JOIN roles rlA ON rlA.id = praA.approver_role_id
            WHERE praA.payment_request_id = pr.id
              AND praA.step_order = pr.current_step_order
              AND praA.decision = 'PENDING'
              AND (praA.approver_user_id = :viewerId OR rlA.code IN (:...awRoles))
          ))`);
          awParams.awRoles = viewer.roles;
        } else {
          aw.push(`(pr.status = 'PENDING_APPROVAL' AND EXISTS (
            SELECT 1 FROM payment_request_approvals praA
            WHERE praA.payment_request_id = pr.id
              AND praA.step_order = pr.current_step_order
              AND praA.decision = 'PENDING'
              AND praA.approver_user_id = :viewerId
          ))`);
        }
        const r = viewer.roles ?? [];
        if (r.includes('TREASURY_MAKER_ONLINE'))
          aw.push(`(pr.status = 'TREASURY_MAKER' AND pr.tt_mode IS DISTINCT FROM 'OFFLINE_TT')`);
        if (r.includes('TREASURY_MAKER_OFFLINE'))
          aw.push(`(pr.status = 'TREASURY_MAKER' AND pr.tt_mode = 'OFFLINE_TT')`);
        if (r.includes('TREASURY_CHECKER')) aw.push(`(pr.status = 'TREASURY_CHECKER')`);
        if (r.includes('TREASURY_AUTHORISER')) aw.push(`(pr.status = 'TREASURY_AUTHORISER')`);
        qb.andWhere(`(${aw.join(' OR ')})`, awParams);
      }
    }

    // Activity-date filter. A request matches when any recorded action — its
    // creation, a lifecycle transition, or an approval decision — falls inside
    // the window. Periods are resolved against the Dubai calendar; custom
    // dates are inclusive YYYY-MM-DD Dubai days.
    const range = this.resolveActivityRange(query);
    if (range) {
      qb.andWhere(
        `(
          (pr.created_at >= :actStart AND pr.created_at < :actEnd)
          OR (pr.submitted_at >= :actStart AND pr.submitted_at < :actEnd)
          OR (pr.approved_at >= :actStart AND pr.approved_at < :actEnd)
          OR (pr.treasury_maker_at >= :actStart AND pr.treasury_maker_at < :actEnd)
          OR (pr.treasury_checker_at >= :actStart AND pr.treasury_checker_at < :actEnd)
          OR (pr.treasury_authoriser_at >= :actStart AND pr.treasury_authoriser_at < :actEnd)
          OR (pr.completed_at >= :actStart AND pr.completed_at < :actEnd)
          OR (pr.updated_at >= :actStart AND pr.updated_at < :actEnd)
          OR EXISTS (
            SELECT 1 FROM payment_request_approvals pra3
            WHERE pra3.payment_request_id = pr.id
              AND pra3.decided_at >= :actStart AND pra3.decided_at < :actEnd
          )
        )`,
        { actStart: range.start, actEnd: range.end },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Resolve the activity-date filter into a half-open UTC instant range, or
   * null when no date filter was requested. `today` / `month` are derived from
   * the Dubai calendar; an explicit dateFrom/dateTo pair is treated as
   * inclusive Dubai calendar days.
   */
  private resolveActivityRange(query: {
    activityPeriod?: string;
    dateFrom?: string;
    dateTo?: string;
  }): { start: Date; end: Date } | null {
    if (query.activityPeriod === 'today') {
      const d = dubaiToday();
      return dubaiDayRangeUtc(d, d);
    }
    if (query.activityPeriod === 'month') {
      return dubaiDayRangeUtc(dubaiMonthStart(), dubaiToday());
    }
    if (query.dateFrom) {
      return dubaiDayRangeUtc(query.dateFrom, query.dateTo || query.dateFrom);
    }
    return null;
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

        // §6.4 — anomaly detection (flags suspicious patterns; does not block).
        const anomaly = await this.detectAnomalies(pr, em);
        if (anomaly.flagged) {
          pr.anomalyFlag = true;
          pr.anomalyNotes = anomaly.notes.join('\n');
        }

        pr.beneficiarySnapshot = this.snapshotBeneficiary(ben);
      }

      // §1.3/§4.2 — counterparty snapshot
      if (pr.counterparty) {
        pr.counterpartySnapshot = this.snapshotCounterparty(pr.counterparty);
      }

      // Approval chain bootstrap.
      // - If the payment type has a checker configured (user or role), the
      //   checker becomes Step 1 and the matrix is snapshotted later when
      //   the checker approves (see approve(), Phase 1). This keeps the
      //   checker's experience instant and uses the matrix that's
      //   current at checker-decision time.
      // - If no checker is configured (e.g. PDF §5 Vendor Payments,
      //   Consultants, Capex, Exceptional types), submit must snapshot the
      //   matrix immediately and seed steps 1..N from it. Phase 2 in
      //   approve() then walks the chain unchanged.
      const paymentType = await em.findOne(PaymentType, {
        where: { id: pr.paymentTypeId },
        select: ['id', 'checkerUserId', 'checkerRoleId'],
      });

      const hasChecker =
        !!paymentType?.checkerUserId || !!paymentType?.checkerRoleId;

      pr.status = 'PENDING_APPROVAL';
      pr.submittedAt = new Date();
      pr.updatedBy = actorId;

      if (hasChecker) {
        const checkerType: 'USER' | 'ROLE' = paymentType!.checkerUserId
          ? 'USER'
          : 'ROLE';
        pr.currentStepOrder = 1;
        await em.save(pr);
        await em.save(
          em.create(PaymentRequestApproval, {
            paymentRequestId: pr.id,
            stepOrder: 1,
            approverType: checkerType,
            approverUserId: paymentType!.checkerUserId ?? null,
            approverRoleId: paymentType!.checkerRoleId ?? null,
            decision: 'PENDING',
          }),
        );
      } else {
        // No checker — snapshot the matrix immediately and seed steps 1..N.
        const matrix = await em
          .createQueryBuilder(ApprovalMatrix, 'm')
          .where('m.payment_type_id = :pt', { pt: pr.paymentTypeId })
          .andWhere('m.currency_id = :ccy', { ccy: pr.currencyId })
          .andWhere('m.is_active = true')
          .andWhere('m.deleted_at IS NULL')
          .orderBy('m.created_at', 'DESC')
          .getOne();
        if (!matrix) {
          throw new BadRequestException(
            'No active approval matrix found for this payment type and currency. ' +
              'Please create an approval matrix under Masters → Approval Matrices before submitting.',
          );
        }

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
            `The payment amount (${pr.amount}) does not fall within any band defined in the approval matrix. ` +
              'Please update the matrix bands under Masters → Approval Matrices.',
          );
        }
        const matrixSteps = await em.find(ApprovalMatrixStep, {
          where: { bandId: band.id },
          order: { stepOrder: 'ASC' },
        });
        if (!matrixSteps.length) {
          throw new BadRequestException(
            'The matched approval band has no steps configured. Please update the matrix.',
          );
        }

        pr.matrixId = matrix.id;
        pr.ttMode = matrix.ttMode;
        pr.currentStepOrder = 1;
        await em.save(pr);

        let order = 1;
        for (const s of matrixSteps) {
          await em.save(
            em.create(PaymentRequestApproval, {
              paymentRequestId: pr.id,
              stepOrder: order++,
              approverType: s.approverType,
              approverUserId: s.approverUserId ?? null,
              approverRoleId: s.approverRoleId ?? null,
              decision: 'PENDING',
            }),
          );
        }
      }

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  /**
   * §3 — Record an approval at the current step.
   *
   * Two-phase flow:
   *   Phase 1 — Checker (pr.matrixId is null, step 1):
   *     After the checker approves, look up the active approval matrix.
   *     If one exists, append its steps (starting at step 2) and advance
   *     currentStepOrder to 2. If none exists, go straight to APPROVED.
   *
   *   Phase 2 — Matrix chain (pr.matrixId is set):
   *     Advance through the pre-created steps. APPROVED on the final step.
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

      // Authorisation: USER step requires exact match; ROLE step requires actor to hold the role.
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

      if (!pr.matrixId) {
        // ── Phase 1: checker just approved — now check the approval matrix ──
        const matrix = await em
          .createQueryBuilder(ApprovalMatrix, 'm')
          .where('m.payment_type_id = :pt', { pt: pr.paymentTypeId })
          .andWhere('m.currency_id = :ccy', { ccy: pr.currencyId })
          .andWhere('m.is_active = true')
          .andWhere('m.deleted_at IS NULL')
          .orderBy('m.created_at', 'DESC')
          .getOne();

        if (!matrix) {
          // No active matrix — block the approval.
          throw new BadRequestException(
            'No active approval matrix found for this payment type and currency. ' +
            'Please create an approval matrix under Masters → Approval Matrices before approving.',
          );
        }

        // Matrix found — find the matching band for the payment amount.
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
            `The payment amount (${pr.amount}) does not fall within any band defined in the approval matrix. ` +
            'Please update the matrix bands under Masters → Approval Matrices.',
          );
        }
        const matrixSteps = await em.find(ApprovalMatrixStep, {
          where: { bandId: band.id },
          order: { stepOrder: 'ASC' },
        });
        if (!matrixSteps.length) {
          throw new BadRequestException(
            'The matched approval band has no steps configured. Please update the matrix.',
          );
        }

        // Skip any matrix step whose approver matches the checker that just
        // approved step 1 — prevents the same role/user appearing twice.
        const paymentType = await em.findOne(PaymentType, {
          where: { id: pr.paymentTypeId },
          select: ['id', 'checkerRoleId', 'checkerUserId'],
        });
        const stepsToSeed = matrixSteps.filter((s) => {
          if (paymentType?.checkerRoleId && s.approverRoleId === paymentType.checkerRoleId) return false;
          if (paymentType?.checkerUserId && s.approverUserId === paymentType.checkerUserId) return false;
          return true;
        });

        pr.matrixId = matrix.id;
        pr.ttMode = matrix.ttMode;

        if (!stepsToSeed.length) {
          // All remaining matrix steps were duplicates of the checker — the
          // chain is complete, forward straight to the Treasury Team.
          pr.status = 'TREASURY_MAKER';
          pr.currentStepOrder = null;
          pr.approvedAt = new Date();
        } else {
          // Checker was step 1 (APPROVED). Matrix steps start at step 2.
          let nextOrder = 2;
          for (const s of stepsToSeed) {
            await em.save(
              em.create(PaymentRequestApproval, {
                paymentRequestId: pr.id,
                stepOrder: nextOrder++,
                approverType: s.approverType,
                approverUserId: s.approverUserId ?? null,
                approverRoleId: s.approverRoleId ?? null,
                decision: 'PENDING',
              }),
            );
          }
          pr.currentStepOrder = 2;
          // status stays PENDING_APPROVAL — matrix approvers review next
        }
      } else {
        // ── Phase 2: progressing through matrix steps ─────────────────────
        const totalSteps = await em.count(PaymentRequestApproval, {
          where: { paymentRequestId: pr.id },
        });
        const isFinalStep = (pr.currentStepOrder ?? 0) === totalSteps;
        if (pr.sanctionWarning && isFinalStep && !dto.sanctionOverrideReason) {
          throw new BadRequestException(
            'sanctionOverrideReason is required to approve a request flagged against a sanctioned country.',
          );
        }
        if (isFinalStep) {
          // Final approval — forward to the Treasury Team for execution.
          // Ensure the TT mode is snapshotted before the hand-off (covers
          // requests whose matrix was frozen before tt_mode was captured).
          if (!pr.ttMode && pr.matrixId) {
            const m = await em.findOne(ApprovalMatrix, {
              where: { id: pr.matrixId },
              select: ['id', 'ttMode'],
            });
            if (m) pr.ttMode = m.ttMode;
          }
          pr.status = 'TREASURY_MAKER';
          pr.currentStepOrder = null;
          pr.approvedAt = new Date();
          if (dto.sanctionOverrideReason) pr.sanctionOverrideReason = dto.sanctionOverrideReason;
        } else {
          pr.currentStepOrder = (pr.currentStepOrder ?? 0) + 1;
        }
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

  /**
   * §3 — Maker resubmits a REJECTED request.
   * Clears the old approval chain, resets the request to DRAFT so the maker
   * can review / edit before submitting again.
   */
  async resubmit(id: string, actorId: string): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'REJECTED') {
        throw new BadRequestException(`Only REJECTED requests can be resubmitted (current status: ${pr.status}).`);
      }
      if (pr.createdBy !== actorId) {
        throw new ForbiddenException('Only the original maker can resubmit this request.');
      }

      // Delete all previous approval steps so a fresh chain is created on next submit.
      await em.delete(PaymentRequestApproval, { paymentRequestId: pr.id });

      pr.status = 'DRAFT';
      pr.currentStepOrder = null;
      pr.matrixId = null;
      pr.rejectionReason = null;
      pr.submittedAt = null;
      pr.approvedAt = null;
      // Clear any treasury-stage data captured before the rejection.
      pr.ttMode = null;
      pr.treasuryReferenceNumber = null;
      pr.swiftCopyUrl = null;
      pr.treasuryMakerBy = null;
      pr.treasuryMakerAt = null;
      pr.treasuryCheckerBy = null;
      pr.treasuryCheckerAt = null;
      pr.treasuryAuthoriserBy = null;
      pr.treasuryAuthoriserAt = null;
      pr.completedAt = null;
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

  // ===================================================================
  // Treasury Team execution (post final-approval)
  // ===================================================================

  /**
   * Treasury maker captures the bank reference + SWIFT/MT103 copy and forwards
   * the request to the treasury checker. The maker role depends on the TT mode
   * snapshotted from the approval matrix (online vs offline).
   */
  async treasurySubmit(
    id: string,
    dto: TreasurySubmitDto,
    actorId: string,
  ): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'TREASURY_MAKER') {
        throw new BadRequestException(`Cannot submit treasury info in status ${pr.status}`);
      }
      const makerRole =
        pr.ttMode === 'OFFLINE_TT'
          ? RoleCode.TREASURY_MAKER_OFFLINE
          : RoleCode.TREASURY_MAKER_ONLINE;
      await this.assertHasRole(em, actorId, makerRole);

      pr.treasuryReferenceNumber = dto.referenceNumber;
      pr.swiftCopyUrl = dto.swiftCopyUrl;
      pr.treasuryMakerBy = actorId;
      pr.treasuryMakerAt = new Date();
      pr.status = 'TREASURY_CHECKER';
      pr.updatedBy = actorId;
      await em.save(pr);

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  /** Treasury checker marks the captured info as checked → authoriser. */
  async treasuryCheck(
    id: string,
    _dto: TreasuryDecisionDto,
    actorId: string,
  ): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'TREASURY_CHECKER') {
        throw new BadRequestException(`Cannot check in status ${pr.status}`);
      }
      await this.assertHasRole(em, actorId, RoleCode.TREASURY_CHECKER);

      pr.treasuryCheckerBy = actorId;
      pr.treasuryCheckerAt = new Date();
      pr.status = 'TREASURY_AUTHORISER';
      pr.updatedBy = actorId;
      await em.save(pr);

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  /** Treasury authoriser marks the payment completed (terminal). */
  async treasuryComplete(
    id: string,
    _dto: TreasuryDecisionDto,
    actorId: string,
  ): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
      if (pr.status !== 'TREASURY_AUTHORISER') {
        throw new BadRequestException(`Cannot complete in status ${pr.status}`);
      }
      await this.assertHasRole(em, actorId, RoleCode.TREASURY_AUTHORISER);

      // §2.5 — debit the source account's remaining balance on completion
      // (preserved from the retired mark-paid flow) when one is set.
      if (pr.sourceAccountId) {
        const acc = await em.findOne(BankAccount, { where: { id: pr.sourceAccountId } });
        if (acc) {
          acc.remainingBalance = Number(acc.remainingBalance) - Number(pr.amount);
          await em.save(acc);
        }
      }

      pr.treasuryAuthoriserBy = actorId;
      pr.treasuryAuthoriserAt = new Date();
      pr.completedAt = new Date();
      pr.status = 'COMPLETED';
      pr.updatedBy = actorId;
      await em.save(pr);

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  /**
   * Any treasury stage may reject — the request returns to the initiator as
   * REJECTED. The maker then resubmits, which reruns the approval matrix.
   */
  async treasuryReject(
    id: string,
    dto: RejectDto,
    actorId: string,
  ): Promise<PaymentRequest> {
    return this.dataSource.transaction(async (em) => {
      const pr = await em.findOne(PaymentRequest, { where: { id } });
      if (!pr) throw new NotFoundException(`Payment request ${id} not found`);

      const stageRole: RoleCode | null =
        pr.status === 'TREASURY_MAKER'
          ? pr.ttMode === 'OFFLINE_TT'
            ? RoleCode.TREASURY_MAKER_OFFLINE
            : RoleCode.TREASURY_MAKER_ONLINE
          : pr.status === 'TREASURY_CHECKER'
            ? RoleCode.TREASURY_CHECKER
            : pr.status === 'TREASURY_AUTHORISER'
              ? RoleCode.TREASURY_AUTHORISER
              : null;
      if (!stageRole) {
        throw new BadRequestException(`Cannot reject in status ${pr.status}`);
      }
      await this.assertHasRole(em, actorId, stageRole);

      pr.status = 'REJECTED';
      pr.rejectionReason = dto.comments;
      pr.updatedBy = actorId;
      await em.save(pr);

      return this.loadOne(pr.id, em.getRepository(PaymentRequest));
    });
  }

  /** Administrative cancel — any non-terminal status. */
  async cancel(id: string, dto: CancelDto, actorId: string): Promise<PaymentRequest> {
    const pr = await this.findOne(id);
    if (pr.status === 'COMPLETED' || pr.status === 'CANCELLED' || pr.status === 'REJECTED' || pr.status === 'WITHDRAWN') {
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
    if (pr.status !== 'DRAFT' && pr.status !== 'REJECTED') {
      throw new BadRequestException('Documents can only be attached in DRAFT or REJECTED status.');
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
    if (pr.status !== 'DRAFT' && pr.status !== 'REJECTED') {
      throw new BadRequestException('Documents can only be removed in DRAFT or REJECTED status.');
    }
    const doc = await this.docRepo.findOne({ where: { id: documentId, paymentRequestId: pr.id } });
    if (!doc) throw new NotFoundException('Document not found.');

    // Delete the file from S3 (only for full S3 URLs; local /uploads/ paths are skipped)
    if (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) {
      try {
        const { pathname } = new URL(doc.fileUrl);
        // Works for both virtual-hosted AWS URLs (/uploads/file.pdf)
        // and path-style MinIO URLs (/bucket/uploads/file.pdf)
        const uploadsIdx = pathname.indexOf('/uploads/');
        if (uploadsIdx !== -1) {
          await this.s3.deleteFile(pathname.slice(uploadsIdx + 1));
        }
      } catch {
        // Non-fatal — DB record is still removed even if S3 deletion fails
      }
    }

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
  /**
   * Assert the actor holds the given role code (SUPER_ADMIN / platform-admin
   * bypass). Used to gate the treasury maker / checker / authoriser stages.
   */
  private async assertHasRole(
    em: EntityManager,
    actorId: string,
    code: RoleCode,
  ): Promise<void> {
    const userRow = await em
      .getRepository(User)
      .findOne({ where: { id: actorId }, select: ['id', 'isPlatformAdmin'] });
    if (userRow?.isPlatformAdmin) return;

    const has = await em
      .getRepository(UserRole)
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'r')
      .where('ur.user_id = :uid', { uid: actorId })
      .andWhere('r.code IN (:...codes)', { codes: [code, RoleCode.SUPER_ADMIN] })
      .getCount();
    if (has > 0) return;

    throw new ForbiddenException(
      `You do not hold the required role (${code}) to act on this treasury stage.`,
    );
  }

  private async assertCanMake(actorId: string, paymentTypeId: string): Promise<void> {
    const ptRepo = this.dataSource.getRepository(PaymentType);
    const pt = await ptRepo.findOne({
      where: { id: paymentTypeId },
      select: ['id', 'code', 'name', 'makerRoleId', 'makerRoleIds', 'makerUserId'],
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

    // Role-based maker match — the actor may hold any of the type's maker
    // roles (maker_role_ids), or the legacy single primary (maker_role_id).
    const makerRoleIds = [
      ...(pt.makerRoleIds ?? []),
      ...(pt.makerRoleId ? [pt.makerRoleId] : []),
    ];
    if (makerRoleIds.length > 0) {
      const has = await this.dataSource
        .getRepository(UserRole)
        .createQueryBuilder('ur')
        .where('ur.user_id = :uid', { uid: actorId })
        .andWhere('ur.role_id IN (:...roleIds)', { roleIds: makerRoleIds })
        .getCount();
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
      .leftJoinAndSelect('paymentType.legalEntity', 'legalEntity')
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
      .leftJoinAndSelect('pr.treasuryMakerByUser', 'treasuryMakerByUser')
      .leftJoinAndSelect('pr.treasuryCheckerByUser', 'treasuryCheckerByUser')
      .leftJoinAndSelect('pr.treasuryAuthoriserByUser', 'treasuryAuthoriserByUser')
      .leftJoinAndSelect('pr.documents', 'document')
      .where('pr.id = :id', { id })
      .orderBy('approval.stepOrder', 'ASC')
      .addOrderBy('document.uploadedAt', 'ASC')
      .getOne();
    if (!pr) throw new NotFoundException(`Payment request ${id} not found`);
    return pr;
  }

  private async nextRequestNumber(em: { query: (s: string) => Promise<unknown> }): Promise<string> {
    const rows = (await em.query("SELECT nextval('payment_request_seq') AS n")) as Array<{ n: string }>;
    const seq = Number(rows[0].n);
    const year = dubaiYear();
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

  /**
   * §6.4 — Rule-based anomaly detection. Runs at submit time against the
   * beneficiary account. Does NOT block the payment — sets anomaly_flag and
   * anomaly_notes for reviewer awareness.
   *
   * Rules:
   *  1. Amount spike  — current amount > 3× the average of the last 10
   *                     fully-approved payments to the same beneficiary
   *                     (those that reached the treasury stages / completed).
   *  2. Rapid repeat  — 2 or more payment requests already submitted to the
   *                     same beneficiary in the last 7 days (this would make 3+).
   *  3. Recent modify — a MODIFY change request was approved for this
   *                     beneficiary within the last 7 days.
   *  4. New account   — the beneficiary account was activated (ADD approved)
   *                     within the last 7 days.
   */
  private async detectAnomalies(
    pr: PaymentRequest,
    em: EntityManager,
  ): Promise<{ flagged: boolean; notes: string[] }> {
    const notes: string[] = [];
    if (!pr.beneficiaryAccountId) return { flagged: false, notes };

    const bid = pr.beneficiaryAccountId;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    // Rule 1: Amount spike — flag if current amount > 3× the average of the
    // last 10 completed payments to the same beneficiary (need at least 3
    // historical data points to be meaningful).
    const hist = (await em.query(
      `SELECT amount FROM payment_requests
       WHERE beneficiary_account_id = $1
         AND status IN ('TREASURY_MAKER', 'TREASURY_CHECKER', 'TREASURY_AUTHORISER', 'COMPLETED')
         AND deleted_at IS NULL
         AND id <> $2
       ORDER BY submitted_at DESC NULLS LAST
       LIMIT 10`,
      [bid, pr.id],
    )) as Array<{ amount: string }>;
    if (hist.length >= 3) {
      const avg = hist.reduce((s, r) => s + Number(r.amount), 0) / hist.length;
      if (Number(pr.amount) > avg * 3) {
        notes.push(
          `Amount ${Number(pr.amount).toLocaleString()} is more than 3× the average ` +
          `(${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}) of the last ${hist.length} payments to this beneficiary.`,
        );
      }
    }

    // Rule 2: Rapid repeat — flag if 2 or more submissions already exist for
    // this beneficiary in the last 7 days (making this the 3rd+).
    const repeatRows = (await em.query(
      `SELECT COUNT(*) AS cnt FROM payment_requests
       WHERE beneficiary_account_id = $1
         AND submitted_at >= $2
         AND deleted_at IS NULL
         AND id <> $3`,
      [bid, sevenDaysAgo, pr.id],
    )) as Array<{ cnt: string }>;
    const repeatCount = Number(repeatRows[0]?.cnt ?? 0);
    if (repeatCount >= 2) {
      notes.push(
        `${repeatCount} payment requests have already been submitted to this beneficiary in the last 7 days.`,
      );
    }

    // Rule 3: Recent beneficiary modification — a MODIFY change request was
    // approved within the last 7 days.
    const modRows = (await em.query(
      `SELECT COUNT(*) AS cnt FROM beneficiary_account_change_requests
       WHERE beneficiary_account_id = $1
         AND change_type = 'MODIFY'
         AND status = 'APPROVED'
         AND approved_at >= $2
         AND deleted_at IS NULL`,
      [bid, sevenDaysAgo],
    )) as Array<{ cnt: string }>;
    if (Number(modRows[0]?.cnt ?? 0) > 0) {
      notes.push('Beneficiary account details were modified within the last 7 days.');
    }

    // Rule 4: Newly activated account — an ADD change request was approved
    // within the last 7 days (account is brand new).
    const addRows = (await em.query(
      `SELECT COUNT(*) AS cnt FROM beneficiary_account_change_requests
       WHERE beneficiary_account_id = $1
         AND change_type = 'ADD'
         AND status = 'APPROVED'
         AND approved_at >= $2
         AND deleted_at IS NULL`,
      [bid, sevenDaysAgo],
    )) as Array<{ cnt: string }>;
    if (Number(addRows[0]?.cnt ?? 0) > 0) {
      notes.push('Beneficiary account was activated within the last 7 days.');
    }

    return { flagged: notes.length > 0, notes };
  }
}
