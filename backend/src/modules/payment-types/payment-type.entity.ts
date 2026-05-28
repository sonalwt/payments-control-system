import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export type PaymentDirection = 'OUTGOING' | 'INCOMING';

export interface DocumentPolicyItem {
  code: string;
  label: string;
  required: boolean;
  amountThresholdMinor?: number | null;
  currencyCode?: string | null;
}

export interface FieldConfigItem {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
  readOnly: boolean;
  sortOrder: number;
  helpText?: string | null;
}

@Entity({ name: 'payment_types' })
export class PaymentType extends BaseEntity {
  @Column({ type: 'varchar', length: 40 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 10 })
  direction!: PaymentDirection;

  @Column({ name: 'requires_approval_chain', type: 'boolean', default: true })
  requiresApprovalChain!: boolean;

  @Column({ name: 'is_batch_based', type: 'boolean', default: false })
  isBatchBased!: boolean;

  @Column({ name: 'is_confidential', type: 'boolean', default: false })
  isConfidential!: boolean;

  @Column({ name: 'mobile_initiation_only', type: 'boolean', default: false })
  mobileInitiationOnly!: boolean;

  @Column({ name: 'allows_cross_currency', type: 'boolean', default: true })
  allowsCrossCurrency!: boolean;

  @Column({ name: 'document_policy', type: 'jsonb', default: () => "'[]'" })
  documentPolicy!: DocumentPolicyItem[];

  @Column({ name: 'field_config', type: 'jsonb', default: () => "'[]'" })
  fieldConfig!: FieldConfigItem[];

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: string | null;
}
