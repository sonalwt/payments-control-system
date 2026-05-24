import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Employee } from '../employees/employee.entity';
import { User } from '../users/user.entity';

export type EbacChangeType = 'ADD' | 'MODIFY' | 'DEACTIVATE';
export type EbacStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

@Entity({ name: 'employee_bank_account_changes' })
@Index('idx_ebac_employee', ['employeeId'])
@Index('idx_ebac_status', ['status'])
export class EmployeeBankAccountChange extends BaseEntity {
  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'change_type', type: 'varchar', length: 15 })
  changeType!: EbacChangeType;

  @Column({ name: 'status', type: 'varchar', length: 25, default: 'PENDING_VERIFICATION' })
  status!: EbacStatus;

  @Column({ name: 'proposed_data', type: 'jsonb', default: '{}' })
  proposedData!: Record<string, unknown>;

  @Column({ name: 'documents', type: 'jsonb', default: '[]' })
  documents!: Array<{ documentCode: string; fileName: string; fileUrl: string; mimeType?: string }>;

  @Column({ name: 'anomaly_flag', type: 'boolean', default: false })
  anomalyFlag!: boolean;

  @Column({ name: 'anomaly_notes', type: 'text', nullable: true })
  anomalyNotes?: string | null;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by' })
  requester!: User;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
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

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'approved_by' })
  approver?: User | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rejected_by' })
  rejector?: User | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;
}
