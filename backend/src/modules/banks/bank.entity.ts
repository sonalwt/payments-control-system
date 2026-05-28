import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../countries/country.entity';

@Entity({ name: 'banks' })
export class Bank extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'short_name', type: 'varchar', length: 50, nullable: true })
  shortName?: string | null;

  @Column({ name: 'country_id', type: 'uuid' })
  countryId!: string;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_id' })
  country?: Country;

  @Column({ name: 'swift_bic', type: 'varchar', length: 20, nullable: true })
  swiftBic?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_counterparty', type: 'boolean', default: false })
  isCounterparty!: boolean;
}
