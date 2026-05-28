import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { BusinessUnit } from '../business-units/business-unit.entity';

@Entity({ name: 'departments' })
export class Department extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'legal_entity_id', type: 'uuid', nullable: true })
  legalEntityId?: string | null;

  @ManyToOne(() => LegalEntity)
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity?: LegalEntity | null;

  @Column({ name: 'business_unit_id', type: 'uuid', nullable: true })
  businessUnitId?: string | null;

  @ManyToOne(() => BusinessUnit)
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit?: BusinessUnit | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
