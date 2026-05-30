import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { BeneficiaryAccount } from './beneficiary-account.entity';
import { User } from '../users/user.entity';

export type ChangeRequestType = 'ADD' | 'MODIFY' | 'DEACTIVATE';
export type ChangeRequestStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ChangeRequestDocument {
  code: string;
  label: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
}

/**
 * SoW §6.2 — Bank Account Change Request workflow.
 * Maker-checker enforced at DB level: verified_by must differ from
 * requested_by. Final approval starts a cooling-off window on the
 * underlying beneficiary account.
 */
@Entity({ name: 'beneficiary_account_change_requests' })
@Index('idx_bacr_status', ['status'])
@Check('chk_bacr_maker_checker', 'verified_by IS NULL OR verified_by <> requested_by')
export class BeneficiaryAccountChangeRequest extends BaseEntity {
  @Column({ name: 'beneficiary_account_id', type: 'uuid', nullable: true })
  beneficiaryAccountId?: string | null;

  @ManyToOne(() => BeneficiaryAccount, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'beneficiary_account_id' })
  beneficiaryAccount?: BeneficiaryAccount | null;

  @Column({ name: 'change_type', type: 'varchar', length: 12 })
  changeType!: ChangeRequestType;

  /**
   * Snapshot of the proposed values. For ADD, the full new-account fields.
   * For MODIFY, the new values for the fields being changed.
   * For DEACTIVATE, may be empty.
   */
  @Column({ name: 'proposed_data', type: 'jsonb', default: () => "'{}'::jsonb" })
  proposedData!: Record<string, unknown>;

  /** §6.2 — Cancelled cheque, bank letter, counterparty letter, etc. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  documents!: ChangeRequestDocument[];

  @Column({ type: 'varchar', length: 25, default: 'PENDING_VERIFICATION' })
  status!: ChangeRequestStatus;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by' })
  requestedByUser?: User;

  @Column({ name: 'requested_at', type: 'timestamptz', default: () => 'now()' })
  requestedAt!: Date;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedByUser?: User | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date | null;

  @Column({ name: 'verification_notes', type: 'text', nullable: true })
  verificationNotes?: string | null;

  /** §6.2 — Free-text record of the independent verification call. */
  @Column({ name: 'callback_evidence', type: 'text', nullable: true })
  callbackEvidence?: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser?: User | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy?: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejectedByUser?: User | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  /** §6.3 — Admin may bypass the default cooling-off period; logged with reason. */
  @Column({ name: 'cooling_off_override', type: 'boolean', default: false })
  coolingOffOverride!: boolean;

  @Column({ name: 'cooling_off_override_reason', type: 'text', nullable: true })
  coolingOffOverrideReason?: string | null;
}
