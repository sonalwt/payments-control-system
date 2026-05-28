import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'currencies' })
export class Currency extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Legacy ISO 4217 alpha-3 column — kept readable for seeded rows and for
  // master consumers (countries) that still display it, but no longer
  // captured in the simplified SUPER_ADMIN form.
  @Column({ type: 'char', length: 3, nullable: true })
  code?: string | null;
}
