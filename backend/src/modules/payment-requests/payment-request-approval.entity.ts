import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';

export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApproverType = 'USER' | 'ROLE';

/**
 * SoW §3 — one row per step in the snapshotted approval chain for a
 * payment request. step_order is dense (1, 2, 3, ...). When the
 * matrix specifies a ROLE, any user holding that role may act on the
 * step. When it specifies a USER, only that user may.
 */
@Entity({ name: 'payment_request_approvals' })
@Check('chk_pra_target', `
  (approver_type = 'USER' AND approver_user_id IS NOT NULL AND approver_role_id IS NULL)
  OR (approver_type = 'ROLE' AND approver_role_id IS NOT NULL AND approver_user_id IS NULL)
`)
export class PaymentRequestApproval {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'payment_request_id', type: 'uuid' })
  paymentRequestId!: string;

  @ManyToOne(() => PaymentRequest, (pr) => pr.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest?: PaymentRequest;

  @Column({ name: 'step_order', type: 'integer' })
  stepOrder!: number;

  @Column({ name: 'approver_type', type: 'varchar', length: 10 })
  approverType!: ApproverType;

  @Column({ name: 'approver_user_id', type: 'uuid', nullable: true })
  approverUserId?: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'approver_user_id' })
  approverUser?: User | null;

  @Column({ name: 'approver_role_id', type: 'uuid', nullable: true })
  approverRoleId?: string | null;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'approver_role_id' })
  approverRole?: Role | null;

  @Column({ type: 'varchar', length: 10, default: 'PENDING' })
  decision!: ApprovalDecision;

  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedBy?: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'decided_by' })
  decidedByUser?: User | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  comments?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
