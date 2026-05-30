import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { Employee } from '../employees/employee.entity';
import { Bank } from '../banks/bank.entity';
import { Currency } from '../currencies/currency.entity';
import { Country } from '../countries/country.entity';

export type BeneficiaryStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE';
export type BeneficiaryDirection = 'PAY_TO' | 'RECEIVE_FROM' | 'BOTH';

/**
 * SoW §6.1 — Beneficiary Master.
 * Each account belongs to exactly one of counterparty (vendor/customer)
 * or employee. PENDING_ACTIVATION accounts cannot be paid until the
 * cooling-off window elapses.
 */
@Entity({ name: 'beneficiary_accounts' })
@Index('idx_bene_status', ['status'])
@Check(
  'chk_bene_owner',
  '(counterparty_id IS NOT NULL AND employee_id IS NULL) OR (counterparty_id IS NULL AND employee_id IS NOT NULL)',
)
export class BeneficiaryAccount extends BaseEntity {
  @Column({ name: 'counterparty_id', type: 'uuid', nullable: true })
  counterpartyId?: string | null;

  @ManyToOne(() => Counterparty, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'counterparty_id' })
  counterparty?: Counterparty | null;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee | null;

  @Column({ name: 'account_holder_name', type: 'varchar', length: 200 })
  accountHolderName!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 60 })
  accountNumber!: string;

  @Column({ name: 'bank_id', type: 'uuid' })
  bankId!: string;

  @ManyToOne(() => Bank, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bank_id' })
  bank?: Bank;

  @Column({ name: 'branch_name', type: 'varchar', length: 120, nullable: true })
  branchName?: string | null;

  @Column({ name: 'swift_bic', type: 'varchar', length: 11, nullable: true })
  swiftBic?: string | null;

  @Column({ name: 'iban', type: 'varchar', length: 34, nullable: true })
  iban?: string | null;

  @Column({ name: 'currency_id', type: 'uuid' })
  currencyId!: string;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'currency_id' })
  currency?: Currency;

  @Column({ name: 'country_id', type: 'uuid' })
  countryId!: string;

  @ManyToOne(() => Country, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'country_id' })
  country?: Country;

  @Column({ name: 'account_direction', type: 'varchar', length: 15, default: 'PAY_TO' })
  accountDirection!: BeneficiaryDirection;

  @Column({ type: 'varchar', length: 25, default: 'PENDING_ACTIVATION' })
  status!: BeneficiaryStatus;

  /** §6.3 — Set on final approval of a change request. Account becomes ACTIVE after this point. */
  @Column({ name: 'cooling_off_until', type: 'timestamptz', nullable: true })
  coolingOffUntil?: Date | null;
}
