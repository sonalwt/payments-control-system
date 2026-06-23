import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'countries' })
export class Country extends BaseEntity {
  @Column({ name: 'country_name', type: 'varchar', length: 120 })
  countryName!: string;

  @Column({ name: 'country_short_name', type: 'varchar', length: 20 })
  countryShortName!: string;

  @Column({ type: 'varchar', length: 10 })
  code!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_sanctioned', type: 'boolean', default: false })
  isSanctioned!: boolean;
}
