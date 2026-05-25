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

@Entity({ name: 'beneficiary_account_change_requests' })
@Index('idx_bacr_status', ['status'])
@Index('idx_bacr_reqby', ['requestedBy'])
@Check('chk_bacr_type', `change_type IN ('ADD','MODIFY','DEACTIVATE')`)
@Check('chk_bacr_status', `status IN ('PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','CANCELLED')`)
@Check('chk_bacr_maker_checker', `verified_by IS NULL OR verified_by <> requested_by`)
export class BeneficiaryAccountChangeRequest extends BaseEntity {
  @ManyToOne(() => BeneficiaryAccount, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'beneficiary_account_id' })
  beneficiaryAccount?: BeneficiaryAccount | null;

  @Column({ name: 'beneficiary_account_id', type: 'uuid', nullable: true })
  beneficiaryAccountId?: string | null;

  @Column({ name: 'change_type', type: 'varchar', length: 12 })
  changeType!: ChangeRequestType;

  @Column({ name: 'status', type: 'varchar', length: 25, default: 'PENDING_VERIFICATION' })
  status!: ChangeRequestStatus;

  @Column({ name: 'proposed_data', type: 'jsonb', default: '{}' })
  proposedData!: Record<string, unknown>;

  @Column({ name: 'documents', type: 'jsonb', default: '[]' })
  documents!: Array<{ documentCode: string; fileName: string; fileUrl: string; mimeType?: string }>;

  /** §6.4 — Set to true when at least one anomaly signal fires on creation. */
  @Column({ name: 'anomaly_flag', type: 'boolean', default: false })
  anomalyFlag!: boolean;

  /** §6.4 — Pipe-separated list of anomaly signals that fired. */
  @Column({ name: 'anomaly_notes', type: 'text', nullable: true })
  anomalyNotes?: string | null;

  /** §6.5 — True when the proposed beneficiary country is in the sanctioned-country master. */
  @Column({ name: 'sanction_warning', type: 'boolean', default: false })
  sanctionWarning!: boolean;

  /** §6.5 — Written acknowledgement from the final approver when sanctionWarning is true. */
  @Column({ name: 'sanction_override_reason', type: 'text', nullable: true })
  sanctionOverrideReason?: string | null;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'requested_by' })
  requester!: User;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier?: User | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date | null;

  @Column({ name: 'verification_notes', type: 'text', nullable: true })
  verificationNotes?: string | null;

  @Column({ name: 'callback_evidence', type: 'text', nullable: true })
  callbackEvidence?: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver?: User | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy?: string | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;
}
