import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Group } from '../groups/group.entity';
import { Currency } from '../currencies/currency.entity';
import { Country } from '../countries/country.entity';

@Entity({ name: 'legal_entities' })
@Unique('uq_legal_entity_name_per_group', ['group', 'name'])
@Unique('uq_legal_entity_code_per_group', ['group', 'code'])
@Index('idx_legal_entities_group_id', ['group'])
export class LegalEntity extends BaseEntity {
  @ManyToOne(() => Group, (g) => g.legalEntities, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  code!: string;

  @Column({ name: 'registered_country', type: 'char', length: 2 })
  registeredCountry!: string;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'base_currency_id' })
  baseCurrency!: Currency;

  @Column({ name: 'base_currency_id', type: 'uuid' })
  baseCurrencyId!: string;

  @Column({ name: 'approval_matrix_ref', type: 'uuid', nullable: true })
  approvalMatrixRef?: string | null;

  @Column({ name: 'tax_identifier', type: 'varchar', length: 50, nullable: true })
  taxIdentifier?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Country, (c) => c.legalEntity)
  countries!: Country[];
}
