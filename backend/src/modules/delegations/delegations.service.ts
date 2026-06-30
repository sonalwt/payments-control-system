import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delegation } from './delegation.entity';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DelegationsService {
  constructor(
    @InjectRepository(Delegation)
    private readonly repo: Repository<Delegation>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(delegatorId: string, dto: CreateDelegationDto): Promise<Delegation> {
    if (dto.delegateeId === delegatorId) {
      throw new BadRequestException('You cannot delegate tasks to yourself');
    }

    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('End date must be on or after start date');
    }

    // Verify delegatee shares at least one role with delegator
    const sharedRoles = await this.repo.manager.query(
      `SELECT COUNT(*) AS cnt
       FROM user_roles ur1
       JOIN user_roles ur2 ON ur1.role_id = ur2.role_id
       WHERE ur1.user_id = $1 AND ur2.user_id = $2`,
      [delegatorId, dto.delegateeId],
    ) as { cnt: string }[];

    if (parseInt(sharedRoles[0]?.cnt ?? '0', 10) === 0) {
      throw new BadRequestException(
        'You can only delegate to users who share at least one role with you',
      );
    }

    const delegation = this.repo.create({
      delegatorId,
      delegateeId: dto.delegateeId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason ?? null,
      status: 'ACTIVE',
      createdBy: delegatorId,
      updatedBy: delegatorId,
    });

    const saved = await this.repo.save(delegation);

    // Reload with relations for the notification message
    const full = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['delegator', 'delegatee'],
    });

    if (full) {
      await this.notificationsService.create(
        dto.delegateeId,
        'DELEGATION_ASSIGNED',
        'Task Delegation Assigned',
        `${full.delegator.fullName} has delegated their tasks to you from ${dto.startDate} to ${dto.endDate}.`,
        { delegationId: saved.id, delegatorName: full.delegator.fullName },
        delegatorId,
      );
    }

    return saved;
  }

  async findOutgoing(delegatorId: string): Promise<Delegation[]> {
    return this.repo.find({
      where: { delegatorId },
      relations: ['delegatee'],
      order: { startDate: 'DESC' },
    });
  }

  async findIncoming(delegateeId: string): Promise<Delegation[]> {
    return this.repo.find({
      where: { delegateeId, status: 'ACTIVE' },
      relations: ['delegator'],
      order: { startDate: 'DESC' },
    });
  }

  async cancel(id: string, userId: string): Promise<Delegation> {
    const delegation = await this.repo.findOne({
      where: { id },
      relations: ['delegator', 'delegatee'],
    });

    if (!delegation) {
      throw new NotFoundException('Delegation not found');
    }

    if (delegation.delegatorId !== userId) {
      throw new ForbiddenException('You can only cancel your own delegations');
    }

    if (delegation.status !== 'ACTIVE') {
      throw new BadRequestException('Only active delegations can be cancelled');
    }

    delegation.status = 'CANCELLED';
    delegation.updatedBy = userId;
    const saved = await this.repo.save(delegation);

    await this.notificationsService.create(
      delegation.delegateeId,
      'DELEGATION_CANCELLED',
      'Task Delegation Cancelled',
      `${delegation.delegator.fullName} has cancelled the task delegation assigned to you (was active until ${delegation.endDate}).`,
      { delegationId: id, delegatorName: delegation.delegator.fullName },
      userId,
    );

    return saved;
  }
}
