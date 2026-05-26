import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Bank } from '../banks/bank.entity';
import { Currency } from '../currencies/currency.entity';

export type ChairmanBeneficiaryStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE';

/**
 * §9 — Chairman beneficiary master.
 * Intentionally separate from beneficiary_accounts: no counterparty/employee
 * owner FK, no accountDirection. Access is restricted to the payments-execution
 * team and the chairman himself.
 */
@Entity({ name: 'chairman_beneficiaries' })
@Index('idx_cb_status', ['status'])
@Check('chk_cb_status', `status IN ('PENDING_ACTIVATION','ACTIVE','INACTIVE')`)
export class ChairmanBeneficiary extends BaseEntity {
  @Column({ name: 'account_holder_name', type: 'varchar', length: 200 })
  accountHolderName!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 60 })
  accountNumber!: string;

  @ManyToOne(() => Bank, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank!: Bank;

  @Column({ name: 'bank_id', type: 'uuid' })
  bankId!: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 150, nullable: true })
  bankName?: string | null;

  @Column({ name: 'branch_name', type: 'varchar', length: 120, nullable: true })
  branchName?: string | null;

  @Column({ name: 'swift_bic', type: 'varchar', length: 11, nullable: true })
  swiftBic?: string | null;

  @Column({ name: 'iban', type: 'varchar', length: 34, nullable: true })
  iban?: string | null;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'currency_id' })
  currency!: Currency;

  @Column({ name: 'currency_id', type: 'uuid' })
  currencyId!: string;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode!: string;

  @Column({ name: 'status', type: 'varchar', length: 25, default: 'PENDING_ACTIVATION' })
  status!: ChairmanBeneficiaryStatus;

  @Column({ name: 'cooling_off_until', type: 'timestamptz', nullable: true })
  coolingOffUntil?: Date | null;

  /** §9 — Set to true when at least one anomaly signal fires on creation. */
  @Column({ name: 'anomaly_flag', type: 'boolean', default: false })
  anomalyFlag!: boolean;

  @Column({ name: 'anomaly_notes', type: 'text', nullable: true })
  anomalyNotes?: string | null;

  /** §9 / §6.5 — True when the beneficiary country is in the sanctioned-country master. */
  @Column({ name: 'sanction_warning', type: 'boolean', default: false })
  sanctionWarning!: boolean;

  @Column({ name: 'sanction_override_reason', type: 'text', nullable: true })
  sanctionOverrideReason?: string | null;
}
