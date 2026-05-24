import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntityRole } from '../user-entity-roles/user-entity-role.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'citext', unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ name: 'employee_code', type: 'varchar', length: 50, nullable: true, unique: true })
  employeeCode?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_platform_admin', type: 'boolean', default: false })
  isPlatformAdmin!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;

  @OneToMany(() => UserEntityRole, (uer) => uer.user)
  entityRoles!: UserEntityRole[];
}
