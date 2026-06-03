import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditAction } from '../../common/enums/audit-action.enum';

/**
 * Append-only audit trail. One row per mutating action performed through the
 * API. Rows are written by {@link AuditInterceptor} and are never updated or
 * deleted, so this entity deliberately does NOT extend BaseEntity (no
 * updated_at / soft-delete columns).
 */
@Entity({ name: 'audit_logs' })
@Index(['entityType', 'entityId'])
@Index(['userId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Semantic action — see {@link AuditAction}. */
  @Index()
  @Column({ type: 'varchar', length: 40 })
  action!: AuditAction | string;

  /** Resource the action targeted, e.g. "Banks", "PaymentRequests", "Auth". */
  @Column({ name: 'entity_type', type: 'varchar', length: 80, nullable: true })
  entityType?: string | null;

  /** Primary identifier of the affected record, when known. */
  @Column({ name: 'entity_id', type: 'varchar', length: 64, nullable: true })
  entityId?: string | null;

  /** Acting user — null for anonymous / pre-auth actions (e.g. failed login). */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 200, nullable: true })
  userEmail?: string | null;

  @Column({ name: 'http_method', type: 'varchar', length: 10 })
  httpMethod!: string;

  @Column({ name: 'path', type: 'text' })
  path!: string;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode?: number | null;

  @Column({ type: 'boolean', default: true })
  success!: boolean;

  /** Route params (e.g. { id, documentId }). */
  @Column({ name: 'params', type: 'jsonb', nullable: true })
  params?: Record<string, unknown> | null;

  /** Request body with sensitive fields redacted. */
  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody?: Record<string, unknown> | null;

  /** Error message when the action failed. */
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
