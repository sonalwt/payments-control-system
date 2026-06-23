import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Currency } from '../currencies/currency.entity';
import { AccountType } from '../account-types/account-type.entity';
import { Bank } from '../banks/bank.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { BankAccountChargeBand } from './bank-account-charge-band.entity';

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

  // Account name = the owning group legal entity. bank_nickname is kept as a
  // denormalised copy of the legal entity name so existing display/search code
  // (which reads bankNickname) continues to work.
  @Column({ name: 'legal_entity_id', type: 'uuid', nullable: true })
  legalEntityId?: string | null;

  @ManyToOne(() => LegalEntity, { nullable: true })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity?: LegalEntity | null;

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

  // Holder of the account (often a group legal entity), free text from the
  // bank-account master sheet.
  @Column({ name: 'account_holder_name', type: 'varchar', length: 200, nullable: true })
  accountHolderName?: string | null;

  // Correspondent-banking / contact details captured on the master sheet.
  @Column({ name: 'swift_bic', type: 'varchar', length: 20, nullable: true })
  swiftBic?: string | null;

  @Column({ name: 'iban', type: 'varchar', length: 60, nullable: true })
  iban?: string | null;

  @Column({ name: 'bank_address', type: 'text', nullable: true })
  bankAddress?: string | null;

  @Column({ name: 'correspondent_bank', type: 'text', nullable: true })
  correspondentBank?: string | null;

  @Column({ name: 'correspondent_swift', type: 'varchar', length: 20, nullable: true })
  correspondentSwift?: string | null;

  @Column({ name: 'contact_name', type: 'varchar', length: 150, nullable: true })
  contactName?: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 40, nullable: true })
  contactPhone?: string | null;

  @Column({ name: 'contact_phone_alt', type: 'varchar', length: 40, nullable: true })
  contactPhoneAlt?: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 150, nullable: true })
  contactEmail?: string | null;

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

  @Column({
    name: 'remaining_balance',
    type: 'decimal',
    precision: 20,
    scale: 4,
    default: 0,
    transformer: {
      to: (v?: number | string | null) => v,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  remainingBalance!: number;

  @Column({ name: 'is_chairman_designated', type: 'boolean', default: false })
  isChairmanDesignated!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_counterparty', type: 'boolean', default: false })
  isCounterparty!: boolean;

  // §1.3 - For counterparty bank accounts, this points to the owning
  // counterparty. NULL for the group's own bank accounts.
  @Column({ name: 'counterparty_id', type: 'uuid', nullable: true })
  counterpartyId?: string | null;

  @ManyToOne(() => Counterparty)
  @JoinColumn({ name: 'counterparty_id' })
  counterparty?: Counterparty | null;

  // Tiered bank charges keyed by payment amount (e.g. 0–1000 → 2%, 1000+ → 5%).
  @OneToMany(() => BankAccountChargeBand, (b) => b.bankAccount, { cascade: true })
  chargeBands?: BankAccountChargeBand[];
}
