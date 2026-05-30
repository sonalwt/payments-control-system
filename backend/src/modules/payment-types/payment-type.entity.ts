import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentCategory } from '../payment-categories/payment-category.entity';
import { Role } from '../roles/role.entity';
import { User } from '../users/user.entity';

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

  @Column({ name: 'payment_category_id', type: 'uuid', nullable: true })
  paymentCategoryId?: string | null;

  @ManyToOne(() => PaymentCategory)
  @JoinColumn({ name: 'payment_category_id' })
  paymentCategory?: PaymentCategory | null;

  @Column({ name: 'maker_role_id', type: 'uuid', nullable: true })
  makerRoleId?: string | null;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'maker_role_id' })
  makerRole?: Role | null;

  @Column({ name: 'checker_role_id', type: 'uuid', nullable: true })
  checkerRoleId?: string | null;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'checker_role_id' })
  checkerRole?: Role | null;

  // Named-user maker / checker — used when the authority matrix assigns
  // a specific individual rather than a team role (e.g. Travel Desk
  // Maker = Venessa). Either the role FK or the user FK may be set.
  @Column({ name: 'maker_user_id', type: 'uuid', nullable: true })
  makerUserId?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'maker_user_id' })
  makerUser?: User | null;

  @Column({ name: 'checker_user_id', type: 'uuid', nullable: true })
  checkerUserId?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'checker_user_id' })
  checkerUser?: User | null;
}
