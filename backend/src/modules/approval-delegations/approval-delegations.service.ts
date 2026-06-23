import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ApprovalDelegation } from './approval-delegation.entity';
import { CreateDelegationDto } from './dto/create-delegation.dto';

/** Role code that identifies an approval-matrix approver. */
const APPROVER_ROLE = 'APPROVER';

@Injectable()
export class ApprovalDelegationsService {
  constructor(
    @InjectRepository(ApprovalDelegation)
    private readonly repo: Repository<ApprovalDelegation>,
    private readonly dataSource: DataSource,
  ) {}

  /** Users holding the APPROVER role (excluding the viewer) — delegate picker. */
  async candidates(viewerId: string): Promise<Array<{ id: string; fullName: string; email: string }>> {
    return this.dataSource.query(
      `SELECT DISTINCT u.id, u.full_name AS "fullName", u.email
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
        WHERE r.code = $1
          AND u.is_active = true
          AND u.deleted_at IS NULL
          AND u.id <> $2
        ORDER BY u.full_name`,
      [APPROVER_ROLE, viewerId],
    );
  }

  /** Active payment types for the scope picker (id + name). */
  async paymentTypes(): Promise<Array<{ id: string; name: string }>> {
    return this.dataSource.query(
      `SELECT id, name FROM payment_types
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY name`,
    );
  }

  /** The viewer's own delegations (as delegator), newest first. */
  async mine(viewerId: string): Promise<ApprovalDelegation[]> {
    return this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.delegate', 'delegate')
      .leftJoinAndSelect('d.paymentType', 'paymentType')
      .where('d.delegator_user_id = :viewerId', { viewerId })
      .orderBy('d.start_date', 'DESC')
      .getMany();
  }

  async create(viewerId: string, dto: CreateDelegationDto): Promise<ApprovalDelegation> {
    if (dto.delegateUserId === viewerId) {
      throw new BadRequestException('You cannot delegate to yourself.');
    }
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('End date must be on or after the start date.');
    }
    // Delegate must hold the APPROVER role.
    const ok = await this.dataSource.query(
      `SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND r.code = $2 LIMIT 1`,
      [dto.delegateUserId, APPROVER_ROLE],
    );
    if (!ok.length) {
      throw new BadRequestException('The selected delegate is not an approver.');
    }
    const entity = this.repo.create({
      delegatorUserId: viewerId,
      delegateUserId: dto.delegateUserId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      paymentTypeId: dto.paymentTypeId ?? null,
      reason: dto.reason ?? null,
      createdBy: viewerId,
    });
    return this.repo.save(entity);
  }

  async cancel(viewerId: string, id: string): Promise<void> {
    const d = await this.repo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Delegation not found.');
    if (d.delegatorUserId !== viewerId) {
      throw new ForbiddenException('You can only cancel your own delegations.');
    }
    await this.repo.softRemove(d);
  }
}
