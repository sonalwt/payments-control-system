import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';

export type ApproverType = 'USER' | 'ROLE';

@Entity({ name: 'approval_matrix_steps' })
export class ApprovalMatrixStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'band_id', type: 'uuid' })
  bandId!: string;

  @ManyToOne(() => ApprovalMatrixBand, (b) => b.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'band_id' })
  band?: ApprovalMatrixBand;

  @Column({ name: 'step_order', type: 'int' })
  stepOrder!: number;

  @Column({ name: 'approver_type', type: 'varchar', length: 10 })
  approverType!: ApproverType;

  @Column({ name: 'approver_user_id', type: 'uuid', nullable: true })
  approverUserId?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approver_user_id' })
  approverUser?: User | null;

  @Column({ name: 'approver_role_id', type: 'uuid', nullable: true })
  approverRoleId?: string | null;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'approver_role_id' })
  approverRole?: Role | null;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
