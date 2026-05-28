import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApprovalMatrix } from './approval-matrix.entity';
import { ApprovalMatrixStep } from './approval-matrix-step.entity';

@Entity({ name: 'approval_matrix_bands' })
export class ApprovalMatrixBand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'matrix_id', type: 'uuid' })
  matrixId!: string;

  @ManyToOne(() => ApprovalMatrix, (m) => m.bands, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matrix_id' })
  matrix?: ApprovalMatrix;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder!: number;

  @Column({
    name: 'min_amount',
    type: 'decimal',
    precision: 20,
    scale: 4,
    transformer: {
      to: (v: number | string) => v,
      from: (v: string) => Number(v),
    },
  })
  minAmount!: number;

  @Column({
    name: 'max_amount',
    type: 'decimal',
    precision: 20,
    scale: 4,
    nullable: true,
    transformer: {
      to: (v?: number | string | null) => v,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  maxAmount?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => ApprovalMatrixStep, (s) => s.band, { cascade: true })
  steps?: ApprovalMatrixStep[];
}
