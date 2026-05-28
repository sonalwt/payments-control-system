import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentType } from '../payment-types/payment-type.entity';
import { Currency } from '../currencies/currency.entity';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';

export type ApprovalMatrixStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED';

@Entity({ name: 'approval_matrices' })
export class ApprovalMatrix extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'payment_type_id', type: 'uuid' })
  paymentTypeId!: string;

  @ManyToOne(() => PaymentType)
  @JoinColumn({ name: 'payment_type_id' })
  paymentType?: PaymentType;

  @Column({ name: 'currency_id', type: 'uuid' })
  currencyId!: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currency_id' })
  currency?: Currency;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'varchar', length: 15, default: 'DRAFT' })
  status!: ApprovalMatrixStatus;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;

  @Column({ name: 'published_by', type: 'uuid', nullable: true })
  publishedBy?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => ApprovalMatrixBand, (b) => b.matrix, { cascade: true })
  bands?: ApprovalMatrixBand[];
}
