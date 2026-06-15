import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'account_types' })
export class AccountType extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
