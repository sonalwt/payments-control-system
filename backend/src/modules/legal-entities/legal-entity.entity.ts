import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../countries/country.entity';

@Entity({ name: 'legal_entities' })
export class LegalEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  code!: string;

  @Column({ name: 'country_id', type: 'uuid', nullable: true })
  countryId?: string | null;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_id' })
  country?: Country | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
