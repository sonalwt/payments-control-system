import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

export interface AuditQuery extends PaginationQueryDto {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  success?: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /**
   * Persist a single audit entry. Auditing must never break the request it is
   * recording, so failures here are logged and swallowed rather than thrown.
   */
  async record(entry: Partial<AuditLog>): Promise<void> {
    try {
      await this.repo.save(this.repo.create(entry));
    } catch (err) {
      this.logger.error(
        `Failed to persist audit log for ${entry.action ?? '?'} ${entry.path ?? ''}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async findAll(query: AuditQuery): Promise<PaginatedResult<AuditLog>> {
    const { page = 1, limit = 50, search } = query;
    const qb = this.repo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.action) qb.andWhere('a.action = :action', { action: query.action });
    if (query.entityType)
      qb.andWhere('a.entityType = :entityType', { entityType: query.entityType });
    if (query.entityId)
      qb.andWhere('a.entityId = :entityId', { entityId: query.entityId });
    if (query.userId) qb.andWhere('a.userId = :userId', { userId: query.userId });
    if (typeof query.success === 'boolean')
      qb.andWhere('a.success = :success', { success: query.success });
    if (search) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('a.userEmail ILIKE :s', { s: `%${search}%` })
            .orWhere('a.path ILIKE :s', { s: `%${search}%` })
            .orWhere('a.entityType ILIKE :s', { s: `%${search}%` });
        }),
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
