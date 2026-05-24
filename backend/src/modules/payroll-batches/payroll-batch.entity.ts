import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';

export type PayrollBatchStatus =
  | 'VALIDATION_FAILED'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

@Entity({ name: 'payroll_batches' })
@Index('idx_payroll_batch_entity', ['legalEntityId'])
@Index('idx_payroll_batch_status', ['status'])
export class PayrollBatch extends BaseEntity {
  @Column({ name: 'batch_number', type: 'text', unique: true })
  batchNumber!: string;

  @ManyToOne(() => LegalEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity!: LegalEntity;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @Column({ name: 'period_label', type: 'text' })
  periodLabel!: string;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  @Column({ name: 'total_gross_minor', type: 'bigint', default: 0 })
  totalGrossMinor!: number;

  @Column({ name: 'total_net_minor', type: 'bigint', default: 0 })
  totalNetMinor!: number;

  @Column({ name: 'employee_count', type: 'int', default: 0 })
  employeeCount!: number;

  @Column({ name: 'variance_flag', type: 'boolean', default: false })
  varianceFlag!: boolean;

  @Column({ name: 'headcount_delta', type: 'int', nullable: true })
  headcountDelta?: number | null;

  @Column({ name: 'sanity_notes', type: 'text', nullable: true })
  sanityNotes?: string | null;

  @Column({ name: 'status', type: 'varchar', length: 25, default: 'DRAFT' })
  status!: PayrollBatchStatus;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy?: string | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy?: string | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;
}
