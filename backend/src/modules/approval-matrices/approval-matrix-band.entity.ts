import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApprovalMatrix } from './approval-matrix.entity';
import { ApprovalMatrixStep } from './approval-matrix-step.entity';

// PG bigint comes back as string; round-trip via number for safety within JS-safe integer range.
const bigintTransformer = {
  to: (v?: number | null): string | null | undefined =>
    v === null || v === undefined ? v : String(v),
  from: (v?: string | null): number | null | undefined =>
    v === null || v === undefined ? v : Number(v),
};

@Entity({ name: 'approval_matrix_bands' })
@Index('idx_amb_currency', ['matrixId', 'currencyCode'])
export class ApprovalMatrixBand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'matrix_id', type: 'uuid' })
  matrixId!: string;

  @ManyToOne(() => ApprovalMatrix, (m) => m.bands, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matrix_id' })
  matrix!: ApprovalMatrix;

  @Column({ name: 'currency_code', type: 'char', length: 3 })
  currencyCode!: string;

  @Column({ name: 'min_amount_minor', type: 'bigint', transformer: bigintTransformer })
  minAmountMinor!: number;

  @Column({
    name: 'max_amount_minor',
    type: 'bigint',
    nullable: true,
    transformer: bigintTransformer,
  })
  maxAmountMinor?: number | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => ApprovalMatrixStep, (step) => step.band, {
    cascade: true,
    eager: false,
  })
  steps!: ApprovalMatrixStep[];
}
