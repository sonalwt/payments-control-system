import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';

@Entity({ name: 'groups' })
@Index('uq_group_name', ['name'], { unique: true, where: '"deleted_at" IS NULL' })
export class Group extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => LegalEntity, (le) => le.group)
  legalEntities!: LegalEntity[];
}
