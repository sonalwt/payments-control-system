import { Check, Column, DeleteDateColumn, Entity, Index } from 'typeorm';
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * SOW §2.1 — Currency Master.
 * ISO 4217 alpha-3 code (unique), display name, active flag. Approval
 * thresholds are defined in native currency; no FX conversion is applied
 * to thresholds. `isSystem` flags currencies seeded by the platform — they
 * cannot be deleted (admins may only deactivate them).
 */
@Entity({ name: 'currencies' })
@Index('idx_currencies_active', ['isActive'])
@Check('chk_currency_code', `code ~ '^[A-Z]{3}$'`)
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 3, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ name: 'numeric_code', type: 'char', length: 3, nullable: true })
  numericCode?: string | null;

  @Column({ name: 'minor_unit', type: 'smallint', default: 2 })
  minorUnit!: number;

  @Column({ type: 'varchar', length: 8, nullable: true })
  symbol?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string | null;
}
