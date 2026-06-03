import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';
import { AuditAction } from '../enums/audit-action.enum';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { AuditService } from '../../modules/audit/audit.service';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/** Mutating HTTP verbs — read-only requests are not audited. */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Kebab-case path segment -> semantic action (lifecycle/auth verbs). */
const SEGMENT_ACTION: Record<string, AuditAction> = {
  submit: AuditAction.SUBMIT,
  approve: AuditAction.APPROVE,
  reject: AuditAction.REJECT,
  resubmit: AuditAction.RESUBMIT,
  withdraw: AuditAction.WITHDRAW,
  check: AuditAction.TREASURY_CHECK,
  complete: AuditAction.TREASURY_COMPLETE,
  cancel: AuditAction.CANCEL,
  restore: AuditAction.RESTORE,
  login: AuditAction.LOGIN,
  'forgot-password': AuditAction.FORGOT_PASSWORD,
  'reset-password': AuditAction.RESET_PASSWORD,
};

const METHOD_FALLBACK: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly audit: AuditService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string | string[]) ?? message;
        error = (r.error as string) ?? exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      const e = exception as QueryFailedError & { code?: string; detail?: string };
      if (e.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = e.detail ?? 'Duplicate value violates unique constraint';
        error = 'ConflictError';
      } else if (e.code === '23503') {
        status = HttpStatus.CONFLICT;
        message = 'Cannot complete operation: related records exist';
        error = 'ForeignKeyViolation';
      } else {
        message = 'Database error';
        error = 'DatabaseError';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Audit requests that were rejected BEFORE reaching the route handler
    // (e.g. 401 unauthenticated / 403 wrong role from a guard). Requests that
    // reached the handler are flagged by AuditInterceptor and recorded there,
    // so skipping them here avoids double-logging.
    this.auditBlocked(request, status, message);

    const body: ErrorBody = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }

  /** Record a guard-blocked mutating request as a failed audit entry. */
  private auditBlocked(
    request: Request,
    status: number,
    message: string | string[],
  ): void {
    const handled = (request as Request & { __auditHandled?: boolean }).__auditHandled;
    if (handled || !MUTATING_METHODS.has(request.method)) return;

    const path = request.originalUrl ?? request.url;
    // For 403, the JWT guard already populated req.user before the roles guard
    // rejected — capture who attempted it. For 401 there is no user.
    const user = (request as Request & { user?: AuthenticatedUser }).user;

    void this.audit.record({
      action: this.actionFor(request.method, path),
      entityType: this.resourceFor(path),
      entityId: (request.params as Record<string, string> | undefined)?.id ?? null,
      userId: user?.id ?? null,
      userEmail: user?.email ?? this.bodyEmail(request),
      httpMethod: request.method,
      path,
      statusCode: status,
      success: false,
      errorMessage: Array.isArray(message) ? message.join(', ') : message,
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
    });
  }

  /** Resource the request targeted, derived from the URL path (PascalCase). */
  private resourceFor(path: string): string | null {
    const segments = this.pathSegments(path);
    const resource = segments[0];
    if (!resource) return null;
    return resource
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
  }

  private actionFor(method: string, path: string): AuditAction {
    const segments = this.pathSegments(path);
    const last = segments[segments.length - 1];
    return (
      SEGMENT_ACTION[last] ?? METHOD_FALLBACK[method] ?? AuditAction.ACTION
    );
  }

  /** Path segments after the global `/api/vN` prefix, query stripped. */
  private pathSegments(path: string): string[] {
    return path
      .split('?')[0]
      .split('/')
      .filter((s) => s && s !== 'api' && !/^v\d+$/.test(s));
  }

  private bodyEmail(request: Request): string | null {
    const email = (request.body as Record<string, unknown> | undefined)?.email;
    return typeof email === 'string' ? email : null;
  }
}
