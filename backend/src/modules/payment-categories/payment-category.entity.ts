import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'payment_categories' })
export class PaymentCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
