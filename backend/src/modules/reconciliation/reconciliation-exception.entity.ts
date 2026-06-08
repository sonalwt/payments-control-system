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
import { StatementLine } from './statement-line.entity';
import { BankAccount } from '../bank-accounts/bank-account.entity';

export type ReconciliationExceptionType =
  | 'UNAUTHORISED_PAYMENT'
  | 'UNIDENTIFIED_RECEIPT';

export type ReconciliationExceptionStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'RESOLVED_WITH_JUSTIFICATION'
  | 'CONFIRMED_EXCEPTION';

/**
 * SoW §8.3 — unmatched statement lines escalated for senior investigation.
 * Every unmatched debit is an Unauthorised Payment; every unmatched credit
 * an Unidentified Receipt.
 */
@Entity({ name: 'reconciliation_exceptions' })
export class ReconciliationException {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'exception_number', type: 'varchar', length: 30, unique: true })
  exceptionNumber!: string;

  @Column({ name: 'statement_upload_id', type: 'uuid' })
  statementUploadId!: string;

  @ManyToOne(() => StatementUpload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statement_upload_id' })
  statementUpload?: StatementUpload;

  @Column({ name: 'statement_line_id', type: 'uuid' })
  statementLineId!: string;

  @ManyToOne(() => StatementLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statement_line_id' })
  statementLine?: StatementLine;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @ManyToOne(() => BankAccount)
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccount;

  @Column({ name: 'exception_type', type: 'varchar', length: 25 })
  exceptionType!: ReconciliationExceptionType;

  @Column({ type: 'varchar', length: 30, default: 'OPEN' })
  status!: ReconciliationExceptionStatus;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount!: string;

  @Column({ name: 'currency_code', type: 'varchar', length: 10 })
  currencyCode!: string;

  @Column({ name: 'value_date', type: 'date' })
  valueDate!: string;

  @Column({ name: 'bank_reference', type: 'varchar', length: 140, nullable: true })
  bankReference?: string | null;

  @Column({ name: 'counterparty_text', type: 'varchar', length: 300, nullable: true })
  counterpartyText?: string | null;

  @Column({ type: 'text', nullable: true })
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
