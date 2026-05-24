import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';

export enum ApproverType {
  USER = 'USER',
  ROLE = 'ROLE',
}

@Entity({ name: 'approval_matrix_steps' })
@Index('idx_ams_band', ['bandId'])
export class ApprovalMatrixStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'band_id', type: 'uuid' })
  bandId!: string;

  @ManyToOne(() => ApprovalMatrixBand, (b) => b.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'band_id' })
  band!: ApprovalMatrixBand;

  @Column({ name: 'step_order', type: 'int' })
  stepOrder!: number;

  @Column({ name: 'approver_type', type: 'varchar', length: 10 })
  approverType!: ApproverType;

  @Column({ name: 'approver_user_id', type: 'uuid', nullable: true })
  approverUserId?: string | null;

  @Column({ name: 'approver_role_id', type: 'uuid', nullable: true })
  approverRoleId?: string | null;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
