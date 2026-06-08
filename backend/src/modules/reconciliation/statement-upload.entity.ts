import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { User } from '../users/user.entity';

export type StatementIngestionStatus =
  | 'UPLOADED'
  | 'PARSED'
  | 'PARSE_FAILED'
  | 'MATCHED';

export type StatementIngestionFormat = 'CSV' | 'PDF';

/**
 * SoW §8.1 — one row per uploaded bank statement file. On upload the
 * account's recorded balance is reset to the statement closing balance.
 */
@Entity({ name: 'bank_statement_uploads' })
export class StatementUpload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @ManyToOne(() => BankAccount)
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccount;

  @Column({ name: 'statement_date', type: 'date' })
  statementDate!: string;

  @Column({ name: 'opening_balance', type: 'decimal', precision: 20, scale: 4 })
  openingBalance!: string;

  @Column({ name: 'closing_balance', type: 'decimal', precision: 20, scale: 4 })
  closingBalance!: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl!: string;

  @Column({ name: 'row_count', type: 'integer', default: 0 })
  rowCount!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'ingestion_status', type: 'varchar', length: 20, default: 'UPLOADED' })
  ingestionStatus!: StatementIngestionStatus;

  @Column({ name: 'ingestion_format', type: 'varchar', length: 10, nullable: true })
  ingestionFormat?: StatementIngestionFormat | null;

  @Column({ name: 'ingestion_error', type: 'text', nullable: true })
  ingestionError?: string | null;

  @Column({ name: 'auto_match_completed_at', type: 'timestamptz', nullable: true })
  autoMatchCompletedAt?: Date | null;

  @Column({ name: 'matched_count', type: 'integer', default: 0 })
  matchedCount!: number;

  @Column({ name: 'candidate_count', type: 'integer', default: 0 })
  candidateCount!: number;

  @Column({ name: 'exception_count', type: 'integer', default: 0 })
  exceptionCount!: number;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploader?: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
