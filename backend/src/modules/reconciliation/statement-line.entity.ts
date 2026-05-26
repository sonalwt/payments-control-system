import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { PaymentRequest } from '../payment-requests/payment-request.entity';
import { IncomingReceipt } from '../incoming-receipts/incoming-receipt.entity';
import { StatementUpload } from '../statement-uploads/statement-upload.entity';

export type StatementLineDirection = 'DEBIT' | 'CREDIT';
export type StatementLineMatchStatus =
  | 'UNMATCHED'
  | 'CANDIDATE'
  | 'MATCHED'
  | 'EXCEPTION';

/**
 * SOW §8.1 / §8.2 — One parsed entry on a bank statement.
 *
 * On §8.2 auto-match each line resolves to one of:
 *   - MATCHED   : exact match on amount + bank reference, or unique
 *                 amount-on-account hit with name confirmation.
 *   - CANDIDATE : single plausible match needing human confirmation.
 *   - EXCEPTION : no plausible match → §8.3 exception is created.
 */
@Entity({ name: 'statement_lines' })
@Unique('uq_sl_upload_index', ['statementUploadId', 'lineIndex'])
@Index('idx_sl_upload', ['statementUploadId'])
@Index('idx_sl_match_status', ['matchStatus'])
@Index('idx_sl_account_date', ['bankAccountId', 'valueDate'])
export class StatementLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'statement_upload_id', type: 'uuid' })
  statementUploadId!: string;

  @ManyToOne(() => StatementUpload, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'statement_upload_id' })
  statementUpload?: StatementUpload;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccount;

  @Column({ name: 'line_index', type: 'integer' })
  lineIndex!: number;

  @Column({ name: 'value_date', type: 'date' })
  valueDate!: string;

  @Column({ name: 'posting_date', type: 'date', nullable: true })
  postingDate?: string | null;

  @Column({ name: 'direction', type: 'varchar', length: 6 })
  direction!: StatementLineDirection;

  @Column({ name: 'amount', type: 'decimal', precision: 20, scale: 4 })
  amount!: string;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  @Column({ name: 'bank_reference', type: 'varchar', length: 100, nullable: true })
  bankReference?: string | null;

  @Column({ name: 'counterparty_text', type: 'text', nullable: true })
  counterpartyText?: string | null;

  @Column({ name: 'narrative', type: 'text', nullable: true })
  narrative?: string | null;

  @Column({
    name: 'running_balance',
    type: 'decimal',
    precision: 20,
    scale: 4,
    nullable: true,
  })
  runningBalance?: string | null;

  @Column({
    name: 'match_status',
    type: 'varchar',
    length: 20,
    default: 'UNMATCHED',
  })
  matchStatus!: StatementLineMatchStatus;

  @Column({ name: 'matched_payment_request_id', type: 'uuid', nullable: true })
  matchedPaymentRequestId?: string | null;

  @ManyToOne(() => PaymentRequest, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'matched_payment_request_id' })
  matchedPaymentRequest?: PaymentRequest | null;

  @Column({ name: 'matched_incoming_receipt_id', type: 'uuid', nullable: true })
  matchedIncomingReceiptId?: string | null;

  @ManyToOne(() => IncomingReceipt, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'matched_incoming_receipt_id' })
  matchedIncomingReceipt?: IncomingReceipt | null;

  @Column({
    name: 'match_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  matchScore?: string | null;

  @Column({ name: 'match_reason', type: 'text', nullable: true })
  matchReason?: string | null;

  @Column({ name: 'matched_at', type: 'timestamptz', nullable: true })
  matchedAt?: Date | null;

  @Column({ name: 'matched_by', type: 'uuid', nullable: true })
  matchedBy?: string | null;

  @Column({ name: 'exception_id', type: 'uuid', nullable: true })
  exceptionId?: string | null;

  @Column({ name: 'raw_row', type: 'jsonb', nullable: true })
  rawRow?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
