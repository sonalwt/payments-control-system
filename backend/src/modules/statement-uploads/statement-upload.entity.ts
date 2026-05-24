import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'statement_uploads' })
export class StatementUpload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT', nullable: false })
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

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploader?: User;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
