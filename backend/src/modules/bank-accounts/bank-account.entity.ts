import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Currency } from '../currencies/currency.entity';
import { AccountType } from '../account-types/account-type.entity';
import { Bank } from '../banks/bank.entity';

@Entity({ name: 'bank_accounts' })
export class BankAccount extends BaseEntity {
  @Column({ name: 'bank_id', type: 'uuid', nullable: true })
  bankId?: string | null;

  @ManyToOne(() => Bank)
  @JoinColumn({ name: 'bank_id' })
  bank?: Bank | null;

  // Legacy free-text bank name — preserved for rows created before the
  // bank master existed. New records should use bankId.
  @Column({ name: 'bank_name', type: 'varchar', length: 150, nullable: true })
  bankName?: string | null;

  @Column({ name: 'bank_nickname', type: 'varchar', length: 100, nullable: true })
  bankNickname?: string | null;

  @Column({ name: 'currency_id', type: 'uuid' })
  currencyId!: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currency_id' })
  currency?: Currency;

  @Column({ name: 'account_type_id', type: 'uuid', nullable: true })
  accountTypeId?: string | null;

  @ManyToOne(() => AccountType)
  @JoinColumn({ name: 'account_type_id' })
  accountTypeMaster?: AccountType | null;

  @Column({ name: 'account_number', type: 'varchar', length: 50 })
  accountNumber!: string;

  @Column({ name: 'branch_name', type: 'varchar', length: 150, nullable: true })
  branchName?: string | null;

  @Column({ name: 'branch_code', type: 'varchar', length: 50, nullable: true })
  branchCode?: string | null;

  @Column({
    name: 'opening_balance',
    type: 'decimal',
    precision: 20,
    scale: 4,
    default: 0,
    transformer: {
      to: (v?: number | string | null) => v,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  openingBalance!: number;

  @Column({
    name: 'minimum_balance',
    type: 'decimal',
    precision: 20,
    scale: 4,
    default: 0,
    transformer: {
      to: (v?: number | string | null) => v,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  minimumBalance!: number;

  @Column({ name: 'is_chairman_designated', type: 'boolean', default: false })
  isChairmanDesignated!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_counterparty', type: 'boolean', default: false })
  isCounterparty!: boolean;
}
