import { Check, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'sanctioned_countries' })
@Index('idx_sanctioned_countries_active', ['isActive'])
@Check('chk_sanctioned_country_code', `country_code ~ '^[A-Z]{2}$'`)
export class SanctionedCountry extends BaseEntity {
  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode!: string;

  @Column({ name: 'country_name', type: 'varchar', length: 120 })
  countryName!: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
