import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { EmployeeBankAccountChange } from './employee-bank-account-change.entity';
import { CreateEbacDto } from './dto/create-ebac.dto';
import { CancelEbacDto, RejectEbacDto, VerifyEbacDto } from './dto/action-ebac.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

export interface EbacQuery extends PaginationQueryDto {
  employeeId?: string;
  status?: string;
}

@Injectable()
export class EmployeeBankAccountChangesService {
  constructor(
    @InjectRepository(EmployeeBankAccountChange)
    private readonly repo: Repository<EmployeeBankAccountChange>,
  ) {}

  async create(dto: CreateEbacDto, userId: string): Promise<EmployeeBankAccountChange> {
    const change = this.repo.create({
      employeeId: dto.employeeId,
      changeType: dto.changeType as EmployeeBankAccountChange['changeType'],
      proposedData: dto.proposedData,
      documents: dto.documents ?? [],
      requestedBy: userId,
      status: 'PENDING_VERIFICATION',
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(change);
  }

  async findAll(query: EbacQuery): Promise<PaginatedResult<EmployeeBankAccountChange>> {
    const { page = 1, limit = 20, employeeId, status } = query;

    const where: FindOptionsWhere<EmployeeBankAccountChange> = { deletedAt: IsNull() };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status as EmployeeBankAccountChange['status'];

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: { employee: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<EmployeeBankAccountChange> {
    const change = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { employee: true, requester: true, verifier: true, approver: true, rejector: true },
    });
    if (!change) throw new NotFoundException('Bank account change request not found. It may have been deleted or the link is invalid.');
    return change;
  }

  async verify(id: string, dto: VerifyEbacDto, userId: string): Promise<EmployeeBankAccountChange> {
    const change = await this.findOne(id);
    if (change.status !== 'PENDING_VERIFICATION') {
      const label = change.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      throw new BadRequestException(
        `This request is currently "${label}" and cannot be verified. Only requests in "Pending Verification" status can be verified.`,
      );
    }
    if (change.requestedBy === userId) {
      throw new ForbiddenException(
        'You cannot verify a request that you submitted. Please ask a different team member to verify it (maker-checker policy).',
      );
    }
    change.status = 'VERIFIED';
    change.verifiedBy = userId;
    change.verifiedAt = new Date();
    change.verificationNotes = dto.verificationNotes ?? null;
    change.callbackEvidence = dto.callbackEvidence ?? null;
    change.updatedBy = userId;
    return this.repo.save(change);
  }

  async approve(id: string, userId: string): Promise<EmployeeBankAccountChange> {
    const change = await this.findOne(id);
    if (change.status !== 'VERIFIED') {
      const label = change.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      throw new BadRequestException(
        `This request is currently "${label}" and cannot be approved. The request must be verified by a team member before it can be approved.`,
      );
    }
    if (change.requestedBy === userId) {
      throw new ForbiddenException(
        'You cannot approve a request that you submitted. Please ask a Finance Head or Approver to review it (maker-checker policy).',
      );
    }

    // Anomaly detection
    const anomalyReasons: string[] = [];

    // 1. Terminated employee
    if (change.employee.employmentEndDate) {
      anomalyReasons.push(`Employee ${change.employee.employeeCode} has an employment end date (${change.employee.employmentEndDate})`);
    }

    // 2. Check for bank detail change that differs from previously approved account
    if (change.changeType === 'MODIFY' || change.changeType === 'ADD') {
      const pd = change.proposedData;
      const prevApproved = await this.repo
        .createQueryBuilder('ebac')
        .where('ebac.employee_id = :eid', { eid: change.employeeId })
        .andWhere("ebac.status = 'APPROVED'")
        .andWhere('ebac.deleted_at IS NULL')
        .orderBy('ebac.approved_at', 'DESC')
        .getOne();

      if (prevApproved) {
        const prevData = prevApproved.proposedData;
        const bankChanged = pd['bankId'] && pd['bankId'] !== prevData['bankId'];
        const accountChanged = pd['accountNumber'] && pd['accountNumber'] !== prevData['accountNumber'];
        if (bankChanged || accountChanged) {
          anomalyReasons.push('Bank details differ from the previously approved account (potential redirection risk)');
        }
      }
    }

    // 3. §5.4d — Account holder name mismatch vs employee full name
    if (change.changeType === 'ADD' || change.changeType === 'MODIFY') {
      const accountHolderName = change.proposedData['accountHolderName'] as string | undefined;
      if (accountHolderName && change.employee.fullName) {
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
        if (normalize(accountHolderName) !== normalize(change.employee.fullName)) {
          anomalyReasons.push(
            `Account holder name "${accountHolderName}" does not match employee name "${change.employee.fullName}" — possible account redirection`,
          );
        }
      }
    }

    // 4. §5.4e — Multiple bank account changes for this employee within a short window (30 days)
    const recentChanges = await this.repo.query(
      `SELECT COUNT(*) AS cnt FROM employee_bank_account_changes
        WHERE employee_id = $1
          AND id != $2
          AND status NOT IN ('REJECTED','CANCELLED')
          AND created_at > now() - INTERVAL '30 days'
          AND deleted_at IS NULL`,
      [change.employeeId, change.id],
    ) as Array<{ cnt: string }>;
    if (Number(recentChanges[0].cnt) > 0) {
      anomalyReasons.push(
        `${recentChanges[0].cnt} other bank account change request(s) exist for this employee within the last 30 days`,
      );
    }

    // 5. Check if the change was submitted within 30 days before a payroll batch close
    const recentBatch = await this.repo.query(
      `SELECT COUNT(*) AS cnt FROM payroll_batches
        WHERE legal_entity_id = (SELECT legal_entity_id FROM employees WHERE id = $1 LIMIT 1)
          AND status IN ('DRAFT','PENDING_APPROVAL')
          AND created_at > now() - INTERVAL '30 days'
          AND deleted_at IS NULL`,
      [change.employeeId],
    ) as Array<{ cnt: string }>;
    if (Number(recentBatch[0].cnt) > 0) {
      anomalyReasons.push('A payroll batch is pending and this account change was submitted within 30 days of batch creation');
    }

    if (anomalyReasons.length > 0) {
      change.anomalyFlag = true;
      change.anomalyNotes = anomalyReasons.join('\n');
    }

    // Apply the change to the employee record
    if (change.changeType === 'ADD' || change.changeType === 'MODIFY') {
      const pd = change.proposedData;
      if (pd['beneficiaryAccountId']) {
        await this.repo.query(
          `UPDATE employees SET employee_bank_account_id = $1, updated_at = now() WHERE id = $2`,
          [pd['beneficiaryAccountId'], change.employeeId],
        );
      }
    } else if (change.changeType === 'DEACTIVATE') {
      await this.repo.query(
        `UPDATE employees SET employee_bank_account_id = NULL, updated_at = now() WHERE id = $1`,
        [change.employeeId],
      );
    }

    change.status = 'APPROVED';
    change.approvedBy = userId;
    change.approvedAt = new Date();
    change.updatedBy = userId;
    return this.repo.save(change);
  }

  async reject(id: string, dto: RejectEbacDto, userId: string): Promise<EmployeeBankAccountChange> {
    const change = await this.findOne(id);
    const allowedStatuses = ['PENDING_VERIFICATION', 'VERIFIED'];
    if (!allowedStatuses.includes(change.status)) {
      const label = change.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      throw new BadRequestException(
        `This request is currently "${label}" and cannot be rejected. Only requests that are pending verification or verified can be rejected.`,
      );
    }
    change.status = 'REJECTED';
    change.rejectedBy = userId;
    change.rejectedAt = new Date();
    change.rejectionReason = dto.reason;
    change.updatedBy = userId;
    return this.repo.save(change);
  }

  async cancel(id: string, dto: CancelEbacDto, userId: string): Promise<EmployeeBankAccountChange> {
    const change = await this.findOne(id);
    const terminal = ['APPROVED', 'REJECTED', 'CANCELLED'];
    if (terminal.includes(change.status)) {
      const label = change.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      throw new BadRequestException(
        `This request has already been "${label}" and cannot be cancelled.`,
      );
    }
    change.status = 'CANCELLED';
    change.rejectionReason = dto.reason ?? null;
    change.updatedBy = userId;
    return this.repo.save(change);
  }
}
