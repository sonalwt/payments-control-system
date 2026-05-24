import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { Employee } from '../employees/employee.entity';
import { Bank } from '../banks/bank.entity';
import { Currency } from '../currencies/currency.entity';

export type BeneficiaryAccountStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE';

@Entity({ name: 'beneficiary_accounts' })
@Unique('uq_bene_account_bank', ['bankId', 'accountNumber'])
@Index('idx_bene_counterparty', ['counterpartyId'])
@Index('idx_bene_employee', ['employeeId'])
@Index('idx_bene_status', ['status'])
@Check('chk_bene_owner', `(counterparty_id IS NOT NULL AND employee_id IS NULL) OR (counterparty_id IS NULL AND employee_id IS NOT NULL)`)
@Check('chk_bene_status', `status IN ('PENDING_ACTIVATION','ACTIVE','INACTIVE')`)
export class BeneficiaryAccount extends BaseEntity {
  @ManyToOne(() => Counterparty, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'counterparty_id' })
  counterparty?: Counterparty | null;

  @Column({ name: 'counterparty_id', type: 'uuid', nullable: true })
  counterpartyId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee | null;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string | null;

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
  status!: BeneficiaryAccountStatus;

  @Column({ name: 'cooling_off_until', type: 'timestamptz', nullable: true })
  coolingOffUntil?: Date | null;

  /** §1.3 — Direction of this account: PAY_TO (outgoing), RECEIVE_FROM (incoming), or BOTH. */
  @Column({ name: 'account_direction', type: 'varchar', length: 15, default: 'PAY_TO' })
  accountDirection!: 'PAY_TO' | 'RECEIVE_FROM' | 'BOTH';
}
