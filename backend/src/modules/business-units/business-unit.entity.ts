import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';

@Entity({ name: 'business_units' })
export class BusinessUnit extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'legal_entity_id', type: 'uuid', nullable: true })
  legalEntityId?: string | null;

  @ManyToOne(() => LegalEntity)
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity?: LegalEntity | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
