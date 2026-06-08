import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentType } from '../payment-types/payment-type.entity';
import { Currency } from '../currencies/currency.entity';
import { Role } from '../roles/role.entity';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';

/** Treasury-Team execution mode — selects which TT maker team handles the payment. */
export type TtMode = 'ONLINE_TT' | 'OFFLINE_TT';

@Entity({ name: 'approval_matrices' })
export class ApprovalMatrix extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'payment_type_id', type: 'uuid' })
  paymentTypeId!: string;

  @ManyToOne(() => PaymentType)
  @JoinColumn({ name: 'payment_type_id' })
  paymentType?: PaymentType;

  @Column({ name: 'currency_id', type: 'uuid' })
  currencyId!: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currency_id' })
  currency?: Currency;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  /** Which Treasury Team executes the payment after final approval. */
  @Column({ name: 'tt_mode', type: 'varchar', length: 20 })
  ttMode!: TtMode;

  // ── Treasury-stage roles ───────────────────────────────────────────
  // The role that acts at each Treasury Team stage. Frozen onto the
  // payment request when the matrix is snapshotted. NULL on legacy
  // matrices, where the treasury stages fall back to the global
  // TREASURY_* roles.
  @Column({ name: 'treasury_maker_role_id', type: 'uuid', nullable: true })
  treasuryMakerRoleId?: string | null;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'treasury_maker_role_id' })
  treasuryMakerRole?: Role | null;

  @Column({ name: 'treasury_checker_role_id', type: 'uuid', nullable: true })
  treasuryCheckerRoleId?: string | null;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'treasury_checker_role_id' })
  treasuryCheckerRole?: Role | null;

  @Column({ name: 'treasury_authoriser_role_id', type: 'uuid', nullable: true })
  treasuryAuthoriserRoleId?: string | null;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'treasury_authoriser_role_id' })
  treasuryAuthoriserRole?: Role | null;

  @OneToMany(() => ApprovalMatrixBand, (b) => b.matrix, { cascade: true })
  bands?: ApprovalMatrixBand[];
}
