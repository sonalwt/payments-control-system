import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { Role } from '../roles/role.entity';

@Entity({ name: 'user_entity_roles' })
@Unique('uq_user_entity_role', ['user', 'legalEntity', 'role'])
@Index('idx_uer_user', ['user'])
@Index('idx_uer_legal_entity', ['legalEntity'])
@Index('idx_uer_role', ['role'])
export class UserEntityRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (u) => u.entityRoles, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => LegalEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity!: LegalEntity;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @ManyToOne(() => Role, (r) => r.userAssignments, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string | null;
}
