import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { PaymentType } from '../payment-types/payment-type.entity';

/**
 * Leave delegation: while an approver (`delegator`) is on leave between
 * `startDate` and `endDate` (inclusive, Dubai calendar days), their pending
 * approvals may also be actioned by the chosen `delegate`. The delegate sees
 * the delegator's pending items in their own queue and approves/rejects on
 * the delegator's behalf. Authorisation is enforced in PaymentRequestsService.
 */
@Entity({ name: 'approval_delegations' })
export class ApprovalDelegation extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'delegator_user_id' })
  delegator!: User;

  @Column({ name: 'delegator_user_id', type: 'uuid' })
  delegatorUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'delegate_user_id' })
  delegate!: User;

  @Column({ name: 'delegate_user_id', type: 'uuid' })
  delegateUserId!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  /** When null, the delegation applies to ALL payment types. */
  @ManyToOne(() => PaymentType, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'payment_type_id' })
  paymentType?: PaymentType | null;

  @Column({ name: 'payment_type_id', type: 'uuid', nullable: true })
  paymentTypeId?: string | null;

  @Column({ name: 'reason', type: 'varchar', length: 200, nullable: true })
  reason?: string | null;
}
