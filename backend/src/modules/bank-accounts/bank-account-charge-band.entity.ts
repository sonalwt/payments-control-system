import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BankAccount } from './bank-account.entity';

/**
 * A tiered bank charge for a bank account: amounts in [minAmount, maxAmount)
 * incur `percentage`% in bank charges. An open-ended band (maxAmount = null)
 * covers everything at or above minAmount. Bands are ordered by sortOrder.
 */
@Entity({ name: 'bank_account_charge_bands' })
export class BankAccountChargeBand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bank_account_id', type: 'uuid' })
  bankAccountId!: string;

  @ManyToOne(() => BankAccount, (a) => a.chargeBands, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccount;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder!: number;

  @Column({
    name: 'min_amount',
    type: 'decimal',
    precision: 20,
    scale: 4,
    transformer: {
      to: (v: number | string) => v,
      from: (v: string) => Number(v),
    },
  })
  minAmount!: number;

  @Column({
    name: 'max_amount',
    type: 'decimal',
    precision: 20,
    scale: 4,
    nullable: true,
    transformer: {
      to: (v?: number | string | null) => v,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  maxAmount?: number | null;

  @Column({
    name: 'percentage',
    type: 'decimal',
    precision: 7,
    scale: 4,
    transformer: {
      to: (v: number | string) => v,
      from: (v: string) => Number(v),
    },
  })
  percentage!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
