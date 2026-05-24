import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum CounterpartyRole {
  VENDOR = 'VENDOR',
  CUSTOMER = 'CUSTOMER',
  BOTH = 'BOTH',
}

export type TaxIdentifierType =
  | 'TRN'
  | 'GSTIN'
  | 'VAT'
  | 'PAN'
  | 'EIN'
  | 'OTHER';

export interface TaxIdentifier {
  type: TaxIdentifierType;
  value: string;
  label?: string | null;
}

export interface Address {
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  isPrimary: boolean;
}

@Entity({ name: 'counterparties' })
@Unique('uq_counterparty_code', ['code'])
@Index('idx_counterparties_role', ['role'])
@Index('idx_counterparties_country', ['countryCode'])
export class Counterparty extends BaseEntity {
  @Column({ type: 'varchar', length: 40 })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 200, nullable: true })
  legalName?: string | null;

  @Column({ type: 'varchar', length: 10 })
  role!: CounterpartyRole;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode!: string;

  @Column({ name: 'tax_identifiers', type: 'jsonb', default: () => "'[]'::jsonb" })
  taxIdentifiers!: TaxIdentifier[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  addresses!: Address[];

  @Column({
    name: 'primary_contact_name',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  primaryContactName?: string | null;

  @Column({
    name: 'primary_contact_email',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  primaryContactEmail?: string | null;

  @Column({
    name: 'primary_contact_phone',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  primaryContactPhone?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
