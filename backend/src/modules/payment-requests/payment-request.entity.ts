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
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { Employee } from '../employees/employee.entity';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { BeneficiaryAccount } from '../beneficiary-accounts/beneficiary-account.entity';
import { PaymentRequestApproval } from './payment-request-approval.entity';
import { PaymentRequestDocument } from './payment-request-document.entity';

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
 * SOW §3 — Payment Lifecycle
 *
 * Canonical status machine:
 *   DRAFT → PENDING_APPROVAL → APPROVED → AWAITING_PAYMENT_CONFIRMATION → PAID
 *   Any non-terminal status may also → REJECTED | WITHDRAWN | CANCELLED
 */
@Entity({ name: 'payment_requests' })
@Index('idx_payment_requests_status', ['status'])
@Index('idx_payment_requests_entity', ['legalEntityId'])
@Index('idx_payment_requests_type', ['paymentTypeCode'])
@Check(
  'chk_pr_status',
  `status IN ('DRAFT','PENDING_APPROVAL','APPROVED','AWAITING_PAYMENT_CONFIRMATION','PAID','REJECTED','WITHDRAWN','CANCELLED')`,
)
@Check('chk_pr_amount_positive', `amount > 0`)
export class PaymentRequest extends BaseEntity {
  /** Auto-generated human-readable number, e.g. PR-2024-00001. */
  @Column({ name: 'request_number', type: 'varchar', length: 30, unique: true })
  requestNumber!: string;

  @Column({ name: 'payment_type_code', type: 'varchar', length: 30 })
  paymentTypeCode!: string;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @ManyToOne(() => LegalEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity!: LegalEntity;

  /** Populated for vendor / incoming-receipt payment types. */
  @Column({ name: 'counterparty_id', type: 'uuid', nullable: true })
  counterpartyId?: string | null;

  @ManyToOne(() => Counterparty, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'counterparty_id' })
  counterparty?: Counterparty | null;

  /** Populated for payroll / reimbursement / FnF payment types. */
  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee | null;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  /** Actual payment amount in the payment currency (DECIMAL). */
  @Column({ name: 'amount', type: 'decimal', precision: 20, scale: 4 })
  amount!: string;

  /** Amount in minor units, used for approval-matrix band matching (§1.5). */
  @Column({ name: 'amount_minor', type: 'bigint' })
  amountMinor!: number;

  @Column({ name: 'purpose_description', type: 'text', nullable: true })
  purposeDescription?: string | null;

  /** §4.1 — Invoice reference number (alphanumeric, no spaces). Required for VENDOR_PAYMENT. */
  @Column({ name: 'invoice_number', type: 'varchar', length: 60, nullable: true })
  invoiceNumber?: string | null;

  /** §4.1 — Invoice payment due date. */
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string | null;

  /** Set by the Maker when releasing the payment (§3, step 4). */
  @Column({ name: 'source_account_id', type: 'uuid', nullable: true })
  sourceAccountId?: string | null;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount?: BankAccount | null;

  /** True when the source account currency differs from the payment currency (§2.6). */
  @Column({ name: 'is_cross_currency', type: 'boolean', default: false })
  isCrossCurrency!: boolean;

  /** Indicative source-currency equivalent at the day's rate (§2.6). */
  @Column({
    name: 'indicative_source_amount',
    type: 'decimal',
    precision: 20,
    scale: 4,
    nullable: true,
  })
  indicativeSourceAmount?: string | null;

  /** Bank's own reference number — captured when moving to PAID. */
  @Column({ name: 'bank_reference', type: 'varchar', length: 100, nullable: true })
  bankReference?: string | null;

  @Column({ name: 'value_date', type: 'date', nullable: true })
  valueDate?: string | null;

  /** URL / path of the proof of payment document (§4.4). */
  @Column({ name: 'proof_of_payment_url', type: 'varchar', length: 500, nullable: true })
  proofOfPaymentUrl?: string | null;

  @Column({ name: 'status', type: 'varchar', length: 40, default: 'DRAFT' })
  status!: PaymentRequestStatus;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  /** Approval-matrix id pinned at submission — in-flight requests keep their original chain. */
  @Column({ name: 'matrix_id', type: 'uuid', nullable: true })
  matrixId?: string | null;

  @Column({ name: 'matrix_version', type: 'integer', nullable: true })
  matrixVersion?: number | null;

  /** Which step is currently awaiting action (null when not in PENDING_APPROVAL). */
  @Column({ name: 'current_step_order', type: 'integer', nullable: true })
  currentStepOrder?: number | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string | null;

  @Column({ name: 'maker_notes', type: 'text', nullable: true })
  makerNotes?: string | null;

  /**
   * §2.5/§2.6 — Set to true when the recorded debit is matched against an
   * uploaded bank statement. Once locked, post-execution amount correction
   * is blocked.
   */
  @Column({ name: 'is_amount_locked', type: 'boolean', default: false })
  isAmountLocked!: boolean;

  /**
   * §4.2/§6.5 — Set to true at submission when the beneficiary account's
   * country (or the counterparty's country) appears in the sanctioned-country
   * master. Visible to approvers as a compliance warning.
   */
  @Column({ name: 'sanction_warning', type: 'boolean', default: false })
  sanctionWarning!: boolean;

  /** §6 — Destination beneficiary account from the verified master. */
  @Column({ name: 'beneficiary_account_id', type: 'uuid', nullable: true })
  beneficiaryAccountId?: string | null;

  @ManyToOne(() => BeneficiaryAccount, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'beneficiary_account_id' })
  beneficiaryAccount?: BeneficiaryAccount | null;

  /** §4.1/4.2 — Snapshot of counterparty/employee data frozen at submission (immutable). */
  @Column({ name: 'counterparty_snapshot', type: 'jsonb', nullable: true })
  counterpartySnapshot?: Record<string, unknown> | null;

  /** §4.2 — Snapshot of beneficiary account data frozen at submission (immutable). */
  @Column({ name: 'beneficiary_snapshot', type: 'jsonb', nullable: true })
  beneficiarySnapshot?: Record<string, unknown> | null;

  @OneToMany(() => PaymentRequestApproval, (a) => a.paymentRequest, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  approvals?: PaymentRequestApproval[];

  @OneToMany(() => PaymentRequestDocument, (d) => d.paymentRequest, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  documents?: PaymentRequestDocument[];
}
