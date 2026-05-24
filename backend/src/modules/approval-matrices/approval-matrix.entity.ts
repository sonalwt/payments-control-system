import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';

export enum ApprovalMatrixStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SUPERSEDED = 'SUPERSEDED',
}

@Entity({ name: 'approval_matrices' })
@Index('idx_am_payment_type', ['paymentTypeCode'])
@Index('idx_am_status', ['status'])
export class ApprovalMatrix {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'payment_type_code', type: 'varchar', length: 50 })
  paymentTypeCode!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 20, default: ApprovalMatrixStatus.DRAFT })
  status!: ApprovalMatrixStatus;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;

  @Column({ name: 'published_by', type: 'uuid', nullable: true })
  publishedBy?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

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

  @OneToMany(() => ApprovalMatrixBand, (band) => band.matrix, {
    cascade: true,
    eager: false,
  })
  bands!: ApprovalMatrixBand[];
}
