import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BankAccount } from './bank-account.entity';

/**
 * Append-only ledger of every change to an account's recorded balance.
 *
 * Captures:
 *   - PAYMENT_DEBIT       : an outgoing payment marked Paid (§2.5)
 *   - RECEIPT_CREDIT      : an incoming receipt marked Received (§2.5)
 *   - STATEMENT_RESET     : weekly bank-statement upload reset (§8 / §2.5)
 *   - MANUAL_OVERRIDE     : an authorised admin override between reconciliations
 *   - PAYMENT_CORRECTION  : post-execution amount correction (§2.6) on a
 *                           cross-currency payment, before the debit is matched
 *                           against a statement upload.
 *
 * Mirrors the pattern of an audit_logs row but is queryable directly per
 * account (the audit_logs JSON blob is not ergonomic for "show me every
 * movement on account X").
 */
export type BalanceChangeKind =
  | 'PAYMENT_DEBIT'
  | 'RECEIPT_CREDIT'
  | 'STATEMENT_RESET'
  | 'MANUAL_OVERRIDE'
  | 'PAYMENT_CORRECTION';

@Entity({ name: 'balance_changes' })
@Index('idx_balance_changes_account_time', ['accountId', 'createdAt'])
@Index('idx_balance_changes_kind', ['kind'])
@Check(
  'chk_balance_change_kind',
  `kind IN ('PAYMENT_DEBIT','RECEIPT_CREDIT','STATEMENT_RESET','MANUAL_OVERRIDE','PAYMENT_CORRECTION')`,
)
export class BalanceChange {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BankAccount, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'account_id' })
  account!: BankAccount;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'varchar', length: 25 })
  kind!: BalanceChangeKind;

  @Column({ name: 'previous_balance', type: 'decimal', precision: 20, scale: 4 })
  previousBalance!: string;

  @Column({ name: 'new_balance', type: 'decimal', precision: 20, scale: 4 })
  newBalance!: string;

  /**
   * Signed delta = new - previous. Stored explicitly for fast aggregation
   * (e.g. "total debits this period").
   */
  @Column({ name: 'delta', type: 'decimal', precision: 20, scale: 4 })
  delta!: string;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason?: string | null;

  /** Forward reference; payment-request entity arrives with the lifecycle module. */
  @Column({ name: 'payment_request_id', type: 'uuid', nullable: true })
  paymentRequestId?: string | null;

  /** Forward reference; receipt entity arrives with §7. */
  @Column({ name: 'receipt_id', type: 'uuid', nullable: true })
  receiptId?: string | null;

  /** Forward reference; statement-upload entity arrives with §8. */
  @Column({ name: 'statement_upload_id', type: 'uuid', nullable: true })
  statementUploadId?: string | null;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
