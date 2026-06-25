import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { User } from '../users/user.entity';

/** Stage a payment request was rejected from. */
export type RejectionStage =
  | 'APPROVAL'
  | 'TREASURY_MAKER'
  | 'TREASURY_CHECKER'
  | 'TREASURY_AUTHORISER';

/**
 * Append-only history of every rejection a payment request has received,
 * preserved across resubmissions. The approval chain is wiped when the maker
 * resubmits (a fresh matrix is snapshotted), so the rejection trail is kept
 * here instead and never updated or deleted. Visible to anyone who can view
 * the request.
 */
@Entity({ name: 'payment_request_rejections' })
@Index(['paymentRequestId', 'rejectedAt'])
export class PaymentRequestRejection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'payment_request_id', type: 'uuid' })
  paymentRequestId!: string;

  @ManyToOne(() => PaymentRequest, (pr) => pr.rejections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest?: PaymentRequest;

  /** Stage the request was rejected from. */
  @Column({ name: 'stage', type: 'varchar', length: 30 })
  stage!: RejectionStage;

  /** Approval step (1-based) for APPROVAL-stage rejections; null otherwise. */
  @Column({ name: 'step_order', type: 'integer', nullable: true })
  stepOrder?: number | null;

  /** 1-based count of this rejection within the request's rejection history. */
  @Column({ name: 'attempt_no', type: 'integer', default: 1 })
  attemptNo!: number;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejectedByUser?: User | null;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason?: string | null;

  /**
   * Full snapshot of the request's details at the moment of rejection (amount,
   * legal entity, beneficiary, source account, documents, treasury reference,
   * etc.). Preserved so the rejected version stays viewable even after the
   * maker edits and resubmits.
   */
  @Column({ name: 'snapshot', type: 'jsonb', nullable: true })
  snapshot?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'rejected_at', type: 'timestamptz' })
  rejectedAt!: Date;
}
