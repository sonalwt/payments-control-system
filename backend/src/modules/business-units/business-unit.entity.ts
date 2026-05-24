import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../countries/country.entity';
import { Department } from '../departments/department.entity';

@Entity({ name: 'business_units' })
@Unique('uq_bu_name_per_country', ['country', 'name'])
@Unique('uq_bu_code_per_country', ['country', 'code'])
@Index('idx_business_units_country_id', ['country'])
export class BusinessUnit extends BaseEntity {
  @ManyToOne(() => Country, (c) => c.businessUnits, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'country_id' })
  country!: Country;

  @Column({ name: 'country_id', type: 'uuid' })
  countryId!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Department, (d) => d.businessUnit)
  departments!: Department[];
}
