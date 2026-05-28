import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../countries/country.entity';

export type CounterpartyRole = 'VENDOR' | 'CUSTOMER' | 'BOTH';

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
export class Counterparty extends BaseEntity {
  @Column({ type: 'varchar', length: 40 })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 200, nullable: true })
  legalName?: string | null;

  @Column({ type: 'varchar', length: 10 })
  role!: CounterpartyRole;

  @Column({ name: 'country_id', type: 'uuid', nullable: true })
  countryId?: string | null;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_id' })
  country?: Country | null;

  @Column({ name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode?: string | null;

  @Column({ name: 'tax_identifiers', type: 'jsonb', default: () => "'[]'" })
  taxIdentifiers!: TaxIdentifier[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  addresses!: Address[];

  @Column({ name: 'primary_contact_name', type: 'varchar', length: 150, nullable: true })
  primaryContactName?: string | null;

  @Column({ name: 'primary_contact_email', type: 'varchar', length: 150, nullable: true })
  primaryContactEmail?: string | null;

  @Column({ name: 'primary_contact_phone', type: 'varchar', length: 50, nullable: true })
  primaryContactPhone?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'kyc_done', type: 'boolean', default: false })
  kycDone!: boolean;
}
