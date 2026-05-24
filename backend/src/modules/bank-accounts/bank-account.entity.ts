import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { Bank } from '../banks/bank.entity';
import { Currency } from '../currencies/currency.entity';

/**
 * SOW §2.4 — Account Master.
 *
 * One row per group-owned bank account. Each account belongs to exactly
 * one bank, one currency, and one legal entity. `accountType` discriminates
 * behaviour:
 *   - CURRENT   : operational. Selectable as source for outgoing TT and as
 *                 receive-from for incoming receipts. Must carry
 *                 `minimumBalance`; the min-balance control (§2.5) blocks
 *                 any release that would push balance below it.
 *   - COLLATERAL: only used for letter-of-credit payments (out of scope of
 *                 TT flow); never selectable for a TT payment.
 *   - DEPOSIT   : term deposit, held for visibility only. Never selectable
 *                 for any payment or receipt; balance is mutated only by
 *                 explicit admin override (interest accrual / renewal /
 *                 redemption) and never by a workflow event.
 *
 * `balance` is stored as DECIMAL in the account's own currency (NOT minor
 * units) because account balances span both 0- and 2-decimal currencies
 * and the value comes back unscaled from bank statements. `balanceAsOf`
 * and `balanceSource` give the user-visible "as of" line on the dashboard.
 * `isChairmanDesignated` flags the segregated chairman-payment accounts
 * (§9.2) so they can be filtered out of the standard maker source-account
 * picker (and vice versa).
 */
export type BankAccountType = 'CURRENT' | 'COLLATERAL' | 'DEPOSIT';
export type BalanceSource =
  | 'SEEDED'
  | 'SYSTEM_COMPUTED'
  | 'STATEMENT_RECONCILED'
  | 'MANUAL_OVERRIDE';

@Entity({ name: 'bank_accounts' })
@Unique('uq_bank_account_number_per_bank', ['bank', 'accountNumber'])
@Index('idx_bank_accounts_entity', ['legalEntity'])
@Index('idx_bank_accounts_currency', ['currency'])
@Index('idx_bank_accounts_type', ['accountType'])
@Index('idx_bank_accounts_active', ['isActive'])
@Check(
  'chk_bank_account_type',
  `account_type IN ('CURRENT','COLLATERAL','DEPOSIT')`,
)
@Check(
  'chk_bank_account_min_balance',
  `(account_type = 'CURRENT' AND minimum_balance IS NOT NULL)
   OR (account_type IN ('COLLATERAL','DEPOSIT') AND minimum_balance IS NULL)`,
)
@Check(
  'chk_balance_source',
  `balance_source IN ('SEEDED','SYSTEM_COMPUTED','STATEMENT_RECONCILED','MANUAL_OVERRIDE')`,
)
export class BankAccount extends BaseEntity {
  @Column({ name: 'nickname', type: 'varchar', length: 120 })
  nickname!: string;

  @ManyToOne(() => LegalEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity!: LegalEntity;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @ManyToOne(() => Bank, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank!: Bank;

  @Column({ name: 'bank_id', type: 'uuid' })
  bankId!: string;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency;

  @Column({ name: 'currency_id', type: 'uuid' })
  currencyId!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 50 })
  accountNumber!: string;

  @Column({ name: 'iban', type: 'varchar', length: 34, nullable: true })
  iban?: string | null;

  @Column({ name: 'account_type', type: 'varchar', length: 12 })
  accountType!: BankAccountType;

  @Column({ name: 'branch_name', type: 'varchar', length: 120, nullable: true })
  branchName?: string | null;

  @Column({ name: 'branch_code', type: 'varchar', length: 30, nullable: true })
  branchCode?: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: '0' })
  balance!: string;

  @Column({ name: 'balance_as_of', type: 'timestamptz', default: () => 'now()' })
  balanceAsOf!: Date;

  @Column({ name: 'balance_source', type: 'varchar', length: 30, default: 'SEEDED' })
  balanceSource!: BalanceSource;

  @Column({
    name: 'minimum_balance',
    type: 'decimal',
    precision: 20,
    scale: 4,
    nullable: true,
  })
  minimumBalance?: string | null;

  @Column({
    name: 'is_chairman_designated',
    type: 'boolean',
    default: false,
  })
  isChairmanDesignated!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
