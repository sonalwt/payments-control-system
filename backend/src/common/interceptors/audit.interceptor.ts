import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';
import { AuditAction } from '../enums/audit-action.enum';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

export const AUDIT_ENTITY_KEY = 'audit:entity';

/**
 * Persists an `audit_logs` row for every successful state-changing call
 * (POST / PUT / PATCH / DELETE) on a controller that has been tagged with
 * `@SetMetadata(AUDIT_ENTITY_KEY, '<EntityType>')`.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const entityType = this.reflector.getAllAndOverride<string | undefined>(
      AUDIT_ENTITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!entityType) {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const method = req.method.toUpperCase();
    const action = this.methodToAction(method);
    if (!action) {
      return next.handle();
    }
    const userId = req.user?.id;
    const sourceIp = (req.ip ?? req.socket.remoteAddress ?? null) as string | null;
    const userAgent = req.get('user-agent') ?? null;

    return next.handle().pipe(
      tap((result) => {
        const entityId =
          (result as { id?: string } | undefined)?.id ??
          (req.params?.id as string | undefined);
        void this.auditService.record({
          action,
          entityType,
          entityId: entityId ?? null,
          userId: userId ?? null,
          newValues: action === AuditAction.DELETE ? null : (result as Record<string, unknown> | null) ?? null,
          oldValues: null,
          sourceIp,
          userAgent,
        });
      }),
    );
  }

  private methodToAction(method: string): AuditAction | null {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return null;
    }
  }
}
