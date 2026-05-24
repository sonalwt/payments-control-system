import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { BusinessUnit } from '../business-units/business-unit.entity';

@Entity({ name: 'countries' })
@Unique('uq_country_per_legal_entity', ['legalEntity', 'isoCode'])
@Index('idx_countries_legal_entity_id', ['legalEntity'])
export class Country extends BaseEntity {
  @ManyToOne(() => LegalEntity, (le) => le.countries, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity!: LegalEntity;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'iso_code', type: 'char', length: 2 })
  isoCode!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => BusinessUnit, (bu) => bu.country)
  businessUnits!: BusinessUnit[];
}
