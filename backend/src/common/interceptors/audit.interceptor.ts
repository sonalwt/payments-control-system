import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditAction } from '../enums/audit-action.enum';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { AuditService } from '../../modules/audit/audit.service';

/** Mutating HTTP verbs — read-only requests are not audited. */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Body / param keys whose values must never be persisted in the audit trail. */
const REDACTED_KEYS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'oldpassword',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
]);

/** Controller handler name -> semantic audit action. */
const HANDLER_ACTION: Record<string, AuditAction> = {
  create: AuditAction.CREATE,
  update: AuditAction.UPDATE,
  remove: AuditAction.DELETE,
  delete: AuditAction.DELETE,
  restore: AuditAction.RESTORE,
  login: AuditAction.LOGIN,
  forgotPassword: AuditAction.FORGOT_PASSWORD,
  resetPassword: AuditAction.RESET_PASSWORD,
  submit: AuditAction.SUBMIT,
  approve: AuditAction.APPROVE,
  reject: AuditAction.REJECT,
  resubmit: AuditAction.RESUBMIT,
  withdraw: AuditAction.WITHDRAW,
  cancel: AuditAction.CANCEL,
  treasurySubmit: AuditAction.TREASURY_SUBMIT,
  treasuryCheck: AuditAction.TREASURY_CHECK,
  treasuryComplete: AuditAction.TREASURY_COMPLETE,
  treasuryReject: AuditAction.TREASURY_REJECT,
  attachDocument: AuditAction.ATTACH_DOCUMENT,
  removeDocument: AuditAction.REMOVE_DOCUMENT,
  upload: AuditAction.UPLOAD,
};

const METHOD_FALLBACK: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

/**
 * Records one {@link AuditLog} row for every mutating request handled by the
 * application. Classification is derived from the controller class name
 * (entity type) and the handler method name (action), so new modules are
 * audited automatically without any per-module wiring.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    if (!MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    // Mark the request so the global exception filter knows the interceptor
    // ran (i.e. guards passed). Anything the filter sees WITHOUT this flag was
    // rejected before reaching the handler — that's what the filter audits.
    (req as Request & { __auditHandled?: boolean }).__auditHandled = true;

    const startedAt = Date.now();
    const handlerName = context.getHandler().name;
    const className = context.getClass().name;
    const entityType = className.replace(/Controller$/, '');
    const action =
      HANDLER_ACTION[handlerName] ??
      METHOD_FALLBACK[req.method] ??
      AuditAction.ACTION;

    const user = (req as Request & { user?: AuthenticatedUser }).user;
    const base = {
      action,
      entityType,
      userId: user?.id ?? null,
      userEmail: user?.email ?? this.bodyEmail(req),
      httpMethod: req.method,
      path: req.originalUrl ?? req.url,
      params: this.clean(req.params),
      requestBody: this.redact(req.body),
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    };

    return next.handle().pipe(
      tap((data) => {
        const res = context.switchToHttp().getResponse<Response>();
        // Login responds with the authenticated user even though the route is
        // public (req.user is empty) — attribute the entry to that user.
        const loginUser = this.loginUser(data);
        void this.audit.record({
          ...base,
          userId: base.userId ?? loginUser?.id ?? null,
          userEmail: base.userEmail ?? loginUser?.email ?? null,
          entityId: this.resolveEntityId(req, data) ?? loginUser?.id ?? null,
          statusCode: res.statusCode,
          success: true,
          durationMs: Date.now() - startedAt,
        });
      }),
      catchError((err: unknown) => {
        void this.audit.record({
          ...base,
          entityId: this.paramId(req),
          statusCode: this.statusOf(err),
          success: false,
          errorMessage: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - startedAt,
        });
        return throwError(() => err);
      }),
    );
  }

  private resolveEntityId(req: Request, data: unknown): string | null {
    const fromParam = this.paramId(req);
    if (fromParam) return fromParam;
    if (data && typeof data === 'object' && 'id' in data) {
      const id = (data as { id?: unknown }).id;
      if (typeof id === 'string' || typeof id === 'number') return String(id);
    }
    return null;
  }

  private loginUser(data: unknown): { id?: string; email?: string } | null {
    if (data && typeof data === 'object' && 'user' in data) {
      const u = (data as { user?: { id?: string; email?: string } }).user;
      if (u && typeof u === 'object') return u;
    }
    return null;
  }

  private paramId(req: Request): string | null {
    const id = (req.params as Record<string, string> | undefined)?.id;
    return id ?? null;
  }

  private bodyEmail(req: Request): string | null {
    const email = (req.body as Record<string, unknown> | undefined)?.email;
    return typeof email === 'string' ? email : null;
  }

  private statusOf(err: unknown): number | null {
    const status = (err as { status?: unknown; statusCode?: unknown })?.status;
    if (typeof status === 'number') return status;
    const code = (err as { statusCode?: unknown })?.statusCode;
    return typeof code === 'number' ? code : 500;
  }

  /** Shallow copy that drops empty objects so we store null instead of `{}`. */
  private clean(
    value: Record<string, unknown> | undefined,
  ): Record<string, unknown> | null {
    if (!value || Object.keys(value).length === 0) return null;
    return { ...value };
  }

  /** Recursively redact sensitive keys; returns null for empty bodies. */
  private redact(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') return null;
    const out = this.redactDeep(value) as Record<string, unknown>;
    return Object.keys(out).length === 0 ? null : out;
  }

  private redactDeep(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((v) => this.redactDeep(v));
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = REDACTED_KEYS.has(k.toLowerCase())
          ? '[REDACTED]'
          : this.redactDeep(v);
      }
      return out;
    }
    return value;
  }
}
