import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../countries/country.entity';
import { User } from '../users/user.entity';

export type CounterpartyRole = 'VENDOR' | 'CUSTOMER' | 'BOTH';

/** Whether the counterparty was raised for trade vs non-trade payments. */
export type PaymentNature = 'TRADE' | 'NON_TRADE';

/**
 * KYC lifecycle. Trade counterparties created by non-admins start PENDING and
 * must be approved by the KYC team before they can be used in a payment
 * request. Non-trade self-service additions are APPROVED immediately but
 * flagged (kycFlagged) so the KYC team can still review them.
 */
export type CounterpartyKycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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

  // Trade vs non-trade — captured at creation, drives the KYC routing.
  @Column({ name: 'payment_nature', type: 'varchar', length: 10, nullable: true })
  paymentNature?: PaymentNature | null;

  // KYC review state. Defaults to APPROVED so pre-existing / admin-created
  // counterparties remain immediately usable; self-service trade additions
  // start PENDING (see CounterpartiesService.create).
  @Column({ name: 'kyc_status', type: 'varchar', length: 10, default: 'APPROVED' })
  kycStatus!: CounterpartyKycStatus;

  // Non-trade self-service additions are usable immediately but flagged here so
  // the KYC team still sees them in their review queue.
  @Column({ name: 'kyc_flagged', type: 'boolean', default: false })
  kycFlagged!: boolean;

  @Column({ name: 'kyc_reviewed_by', type: 'uuid', nullable: true })
  kycReviewedBy?: string | null;

  // Read-only relation for surfacing the reviewer's name. Reads select only
  // id + fullName (see CounterpartiesService) so no sensitive user data leaks.
  @ManyToOne(() => User)
  @JoinColumn({ name: 'kyc_reviewed_by' })
  kycReviewedByUser?: User | null;

  @Column({ name: 'kyc_reviewed_at', type: 'timestamptz', nullable: true })
  kycReviewedAt?: Date | null;

  @Column({ name: 'kyc_rejection_reason', type: 'text', nullable: true })
  kycRejectionReason?: string | null;
}
