import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PayrollBatch } from './payroll-batch.entity';
import { Employee } from '../employees/employee.entity';
import { BeneficiaryAccount } from '../beneficiary-accounts/beneficiary-account.entity';

@Entity({ name: 'payroll_batch_items' })
@Index('idx_pbi_batch', ['batchId'])
@Index('idx_pbi_employee', ['employeeId'])
export class PayrollBatchItem {
  @Column({ name: 'id', type: 'uuid', primary: true, generated: 'uuid' })
  id!: string;

  @ManyToOne(() => PayrollBatch, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'batch_id' })
  batch!: PayrollBatch;

  @Column({ name: 'batch_id', type: 'uuid' })
  batchId!: string;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => BeneficiaryAccount, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'beneficiary_account_id' })
  beneficiaryAccount?: BeneficiaryAccount | null;

  @Column({ name: 'beneficiary_account_id', type: 'uuid', nullable: true })
  beneficiaryAccountId?: string | null;

  @Column({ name: 'gross_amount_minor', type: 'bigint' })
  grossAmountMinor!: number;

  @Column({ name: 'net_amount_minor', type: 'bigint' })
  netAmountMinor!: number;

  @Column({ name: 'deductions_minor', type: 'bigint', default: 0 })
  deductionsMinor!: number;

  @Column({ name: 'payslip_url', type: 'text', nullable: true })
  payslipUrl?: string | null;

  @Column({ name: 'variance_flag', type: 'boolean', default: false })
  varianceFlag!: boolean;

  @Column({ name: 'previous_net_minor', type: 'bigint', nullable: true })
  previousNetMinor?: number | null;

  @Column({ name: 'variance_pct', type: 'numeric', precision: 6, scale: 2, nullable: true })
  variancePct?: number | null;

  @Column({ name: 'payment_request_id', type: 'uuid', nullable: true })
  paymentRequestId?: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
