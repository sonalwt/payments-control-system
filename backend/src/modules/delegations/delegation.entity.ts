import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type DelegationStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

@Entity('delegations')
export class Delegation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'delegator_id', type: 'uuid' })
  @Index()
  delegatorId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'delegator_id' })
  delegator!: User;

  @Column({ name: 'delegatee_id', type: 'uuid' })
  delegateeId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'delegatee_id' })
  delegatee!: User;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: DelegationStatus;

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
