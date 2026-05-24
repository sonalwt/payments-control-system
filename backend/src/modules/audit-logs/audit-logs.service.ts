import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditAction } from '../../common/enums/audit-action.enum';

export interface AuditPayload {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  userId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  sourceIp?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>,
  ) {}

  async record(payload: AuditPayload): Promise<void> {
    try {
      const entity = this.repo.create({
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        userId: payload.userId ?? null,
        oldValues: payload.oldValues ?? null,
        newValues: payload.newValues ?? null,
        sourceIp: payload.sourceIp ?? null,
        userAgent: payload.userAgent ?? null,
      });
      await this.repo.save(entity);
    } catch (err) {
      // Audit must never break the business flow.
      this.logger.error('Failed to persist audit log', err as Error);
    }
  }

  async findForEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
