import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatementUpload } from './statement-upload.entity';
import { PaymentRequest } from '../payment-requests/payment-request.entity';
import { IncomingReceipt } from '../incoming-receipts/incoming-receipt.entity';

export type StatementLineDirection = 'DEBIT' | 'CREDIT';
export type StatementLineMatchStatus =
  | 'UNMATCHED'
  | 'CANDIDATE'
  | 'MATCHED'
  | 'EXCEPTION';

/** SoW §8.2 — one row per parsed statement entry. */
@Entity({ name: 'bank_statement_lines' })
export class StatementLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'statement_upload_id', type: 'uuid' })
  statementUploadId!: string;

  @ManyToOne(() => StatementUpload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statement_upload_id' })
  statementUpload?: StatementUpload;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @Column({ name: 'line_index', type: 'integer' })
  lineIndex!: number;

  @Column({ name: 'value_date', type: 'date' })
  valueDate!: string;

  @Column({ name: 'posting_date', type: 'date', nullable: true })
  postingDate?: string | null;

  @Column({ type: 'varchar', length: 10 })
  direction!: StatementLineDirection;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount!: string;

  @Column({ name: 'currency_code', type: 'varchar', length: 10 })
  currencyCode!: string;

  @Column({ name: 'bank_reference', type: 'varchar', length: 140, nullable: true })
  bankReference?: string | null;

  @Column({ name: 'counterparty_text', type: 'varchar', length: 300, nullable: true })
  counterpartyText?: string | null;

  @Column({ type: 'text', nullable: true })
  narrative?: string | null;

  @Column({ name: 'running_balance', type: 'decimal', precision: 20, scale: 4, nullable: true })
  runningBalance?: string | null;

  @Column({ name: 'match_status', type: 'varchar', length: 15, default: 'UNMATCHED' })
  matchStatus!: StatementLineMatchStatus;

  @Column({ name: 'matched_payment_request_id', type: 'uuid', nullable: true })
  matchedPaymentRequestId?: string | null;

  @ManyToOne(() => PaymentRequest, { nullable: true })
  @JoinColumn({ name: 'matched_payment_request_id' })
  matchedPaymentRequest?: PaymentRequest | null;

  @Column({ name: 'matched_incoming_receipt_id', type: 'uuid', nullable: true })
  matchedIncomingReceiptId?: string | null;

  @ManyToOne(() => IncomingReceipt, { nullable: true })
  @JoinColumn({ name: 'matched_incoming_receipt_id' })
  matchedIncomingReceipt?: IncomingReceipt | null;

  @Column({ name: 'match_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  matchScore?: string | null;

  @Column({ name: 'match_reason', type: 'text', nullable: true })
  matchReason?: string | null;

  @Column({ name: 'matched_at', type: 'timestamptz', nullable: true })
  matchedAt?: Date | null;

  @Column({ name: 'matched_by', type: 'uuid', nullable: true })
  matchedBy?: string | null;

  @Column({ name: 'exception_id', type: 'uuid', nullable: true })
  exceptionId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
