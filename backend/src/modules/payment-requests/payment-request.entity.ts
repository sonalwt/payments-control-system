import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentType } from '../payment-types/payment-type.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { Employee } from '../employees/employee.entity';
import { Currency } from '../currencies/currency.entity';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { BeneficiaryAccount } from '../beneficiary-accounts/beneficiary-account.entity';
import { PaymentRequestApproval } from './payment-request-approval.entity';
import { PaymentRequestDocument } from './payment-request-document.entity';

/** SoW §3 — canonical payment request status machine (MVP). */
export type PaymentRequestStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'AWAITING_PAYMENT_CONFIRMATION'
  | 'PAID'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLED';

/**
 * SoW §3 — Payment Request.
 *
 * Canonical lifecycle:
 *   DRAFT → PENDING_APPROVAL → APPROVED → AWAITING_PAYMENT_CONFIRMATION → PAID
 *
 * Any non-terminal status may also transition to REJECTED, WITHDRAWN
 * (initiator), or CANCELLED (admin). The active approval matrix is
 * snapshotted at submission (§1.5) so in-flight requests are unaffected
 * by later matrix edits.
 */
@Entity({ name: 'payment_requests' })
@Index('idx_pr_status', ['status'])
@Check('chk_pr_amount_positive', 'amount > 0')
export class PaymentRequest extends BaseEntity {
  @Column({ name: 'request_number', type: 'varchar', length: 30, unique: true })
  requestNumber!: string;

  @Column({ name: 'payment_type_id', type: 'uuid' })
  paymentTypeId!: string;

  @ManyToOne(() => PaymentType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_type_id' })
  paymentType?: PaymentType;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @ManyToOne(() => LegalEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity?: LegalEntity;

  /** Populated for vendor / incoming receipt payment types. */
  @Column({ name: 'counterparty_id', type: 'uuid', nullable: true })
  counterpartyId?: string | null;

  @ManyToOne(() => Counterparty, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'counterparty_id' })
  counterparty?: Counterparty | null;

  /** Populated for payroll / reimbursement / FnF. */
  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee | null;

  /** §6 — destination account from the verified master. */
  @Column({ name: 'beneficiary_account_id', type: 'uuid', nullable: true })
  beneficiaryAccountId?: string | null;

  @ManyToOne(() => BeneficiaryAccount, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'beneficiary_account_id' })
  beneficiaryAccount?: BeneficiaryAccount | null;

  /** §4.3 — picked by the Maker at release time. */
  @Column({ name: 'source_account_id', type: 'uuid', nullable: true })
  sourceAccountId?: string | null;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount?: BankAccount | null;

  @Column({ name: 'currency_id', type: 'uuid' })
  currencyId!: string;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'currency_id' })
  currency?: Currency;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount!: string;

  @Column({ name: 'purpose_description', type: 'text', nullable: true })
  purposeDescription?: string | null;

  // §4.1 vendor-specific
  @Column({ name: 'invoice_number', type: 'varchar', length: 60, nullable: true })
  invoiceNumber?: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string | null;

  @Column({ type: 'varchar', length: 40, default: 'DRAFT' })
  status!: PaymentRequestStatus;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt?: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  // §1.5 matrix snapshot
  @Column({ name: 'matrix_id', type: 'uuid', nullable: true })
  matrixId?: string | null;

  @Column({ name: 'matrix_version', type: 'integer', nullable: true })
  matrixVersion?: number | null;

  /** 1-based step index currently awaiting action. Null outside PENDING_APPROVAL. */
  @Column({ name: 'current_step_order', type: 'integer', nullable: true })
  currentStepOrder?: number | null;

  // §4.4
  @Column({ name: 'bank_reference', type: 'varchar', length: 100, nullable: true })
  bankReference?: string | null;

  @Column({ name: 'value_date', type: 'date', nullable: true })
  valueDate?: string | null;

  @Column({ name: 'proof_of_payment_url', type: 'varchar', length: 500, nullable: true })
  proofOfPaymentUrl?: string | null;

  // §6.5
  @Column({ name: 'sanction_warning', type: 'boolean', default: false })
  sanctionWarning!: boolean;

  @Column({ name: 'sanction_override_reason', type: 'text', nullable: true })
  sanctionOverrideReason?: string | null;

  // §6.4 — anomaly flagging (rule-based, set at submit time, does not block)
  @Column({ name: 'anomaly_flag', type: 'boolean', default: false })
  anomalyFlag!: boolean;

  @Column({ name: 'anomaly_notes', type: 'text', nullable: true })
  anomalyNotes?: string | null;

  // §1.3 / §4.2 snapshots frozen at submit
  @Column({ name: 'counterparty_snapshot', type: 'jsonb', nullable: true })
  counterpartySnapshot?: Record<string, unknown> | null;

  @Column({ name: 'beneficiary_snapshot', type: 'jsonb', nullable: true })
  beneficiarySnapshot?: Record<string, unknown> | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string | null;

  @Column({ name: 'withdrawn_reason', type: 'text', nullable: true })
  withdrawnReason?: string | null;

  @OneToMany(() => PaymentRequestApproval, (a) => a.paymentRequest, {
    cascade: ['insert', 'update'],
  })
  approvals?: PaymentRequestApproval[];

  @OneToMany(() => PaymentRequestDocument, (d) => d.paymentRequest, {
    cascade: ['insert', 'update'],
  })
  documents?: PaymentRequestDocument[];
}
