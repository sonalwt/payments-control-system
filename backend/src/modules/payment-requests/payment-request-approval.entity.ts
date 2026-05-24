import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';

export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * SOW §3 — One row per approval step per payment request.
 *
 * Created when the request is submitted (status → PENDING_APPROVAL).
 * Rows are never deleted; the `decision` column tracks the outcome.
 */
@Entity({ name: 'payment_request_approvals' })
@Index('idx_pra_request', ['paymentRequestId'])
@Index('idx_pra_decision', ['decision'])
@Check('chk_pra_approver_type', `approver_type IN ('USER','ROLE')`)
@Check('chk_pra_decision', `decision IN ('PENDING','APPROVED','REJECTED')`)
export class PaymentRequestApproval {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'payment_request_id', type: 'uuid' })
  paymentRequestId!: string;

  @ManyToOne(() => PaymentRequest, (pr) => pr.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest!: PaymentRequest;

  /** Sequential position in the approval chain (1-based). */
  @Column({ name: 'step_order', type: 'integer' })
  stepOrder!: number;

  /** USER — specific user must approve; ROLE — any holder of the role may approve. */
  @Column({ name: 'approver_type', type: 'varchar', length: 10 })
  approverType!: 'USER' | 'ROLE';

  @Column({ name: 'approver_user_id', type: 'uuid', nullable: true })
  approverUserId?: string | null;

  @Column({ name: 'approver_role_id', type: 'uuid', nullable: true })
  approverRoleId?: string | null;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional!: boolean;

  @Column({ name: 'decision', type: 'varchar', length: 10, default: 'PENDING' })
  decision!: ApprovalDecision;

  /** User who recorded the decision. */
  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedBy?: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt?: Date | null;

  @Column({ name: 'comments', type: 'text', nullable: true })
  comments?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
