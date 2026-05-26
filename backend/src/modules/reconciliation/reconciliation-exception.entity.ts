import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { StatementUpload } from '../statement-uploads/statement-upload.entity';
import { StatementLine } from './statement-line.entity';

export type ReconciliationExceptionType =
  | 'UNAUTHORISED_PAYMENT'
  | 'UNIDENTIFIED_RECEIPT';

export type ReconciliationExceptionStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'RESOLVED_WITH_JUSTIFICATION'
  | 'CONFIRMED_EXCEPTION';

/**
 * SOW §8.3 — Exception management.
 *
 * Unmatched debits become Unauthorised Payment Exceptions; unmatched
 * credits become Unidentified Receipt Exceptions. Each carries its own
 * workflow with a mandatory resolution note before closure.
 */
@Entity({ name: 'reconciliation_exceptions' })
@Index('idx_re_status', ['status'])
@Index('idx_re_account', ['bankAccountId'])
@Index('idx_re_type', ['exceptionType'])
@Index('idx_re_upload', ['statementUploadId'])
export class ReconciliationException {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'exception_number', type: 'varchar', length: 30, unique: true })
  exceptionNumber!: string;

  @Column({ name: 'statement_upload_id', type: 'uuid' })
  statementUploadId!: string;

  @ManyToOne(() => StatementUpload, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'statement_upload_id' })
  statementUpload?: StatementUpload;

  @Column({ name: 'statement_line_id', type: 'uuid' })
  statementLineId!: string;

  @ManyToOne(() => StatementLine, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'statement_line_id' })
  statementLine?: StatementLine;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccount;

  @Column({ name: 'exception_type', type: 'varchar', length: 30 })
  exceptionType!: ReconciliationExceptionType;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'OPEN' })
  status!: ReconciliationExceptionStatus;

  @Column({ name: 'amount', type: 'decimal', precision: 20, scale: 4 })
  amount!: string;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  @Column({ name: 'value_date', type: 'date' })
  valueDate!: string;

  @Column({ name: 'bank_reference', type: 'varchar', length: 100, nullable: true })
  bankReference?: string | null;

  @Column({ name: 'counterparty_text', type: 'text', nullable: true })
  counterpartyText?: string | null;

  @Column({ name: 'narrative', type: 'text', nullable: true })
  narrative?: string | null;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote?: string | null;

  @Column({ name: 'investigated_by', type: 'uuid', nullable: true })
  investigatedBy?: string | null;

  @Column({ name: 'investigated_at', type: 'timestamptz', nullable: true })
  investigatedAt?: Date | null;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy?: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
