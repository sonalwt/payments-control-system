import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { BusinessUnit } from '../business-units/business-unit.entity';

@Entity({ name: 'departments' })
@Unique('uq_dept_name_per_bu', ['businessUnit', 'name'])
@Unique('uq_dept_code_per_bu', ['businessUnit', 'code'])
@Index('idx_departments_business_unit_id', ['businessUnit'])
export class Department extends BaseEntity {
  @ManyToOne(() => BusinessUnit, (bu) => bu.departments, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit!: BusinessUnit;

  @Column({ name: 'business_unit_id', type: 'uuid' })
  businessUnitId!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
