import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { IncomingReceiptDocument } from './incoming-receipt-document.entity';

export type IncomingReceiptStatus =
  | 'DRAFT'
  | 'AWAITING_RECEIPT'
  | 'RECEIVED'
  | 'CANCELLED';

/**
 * SOW §7 — Incoming Receipts.
 *
 * Inbound counterpart of outgoing payments. No approval chain (§7.2); on
 * RECEIVED the receive-from account is credited via BankAccountsService and
 * the initiator is notified by email.
 */
@Entity({ name: 'incoming_receipts' })
@Index('idx_ir_status', ['status'])
@Index('idx_ir_entity', ['legalEntityId'])
@Index('idx_ir_counterparty', ['counterpartyId'])
@Check('chk_ir_status', `status IN ('DRAFT','AWAITING_RECEIPT','RECEIVED','CANCELLED')`)
@Check('chk_ir_amount_positive', `expected_amount > 0`)
export class IncomingReceipt extends BaseEntity {
  @Column({ name: 'receipt_number', type: 'varchar', length: 30, unique: true })
  receiptNumber!: string;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @ManyToOne(() => LegalEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity!: LegalEntity;

  @Column({ name: 'counterparty_id', type: 'uuid' })
  counterpartyId!: string;

  @ManyToOne(() => Counterparty, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'counterparty_id' })
  counterparty!: Counterparty;

  /** §7.1 — Required at creation. May be updated at mark-received if the
   * counterparty paid into a different group account. */
  @Column({ name: 'receive_from_account_id', type: 'uuid' })
  receiveFromAccountId!: string;

  @ManyToOne(() => BankAccount, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'receive_from_account_id' })
  receiveFromAccount!: BankAccount;

  @Column({ name: 'expected_amount', type: 'decimal', precision: 20, scale: 4 })
  expectedAmount!: string;

  @Column({ name: 'expected_currency_code', type: 'char', length: 3 })
  expectedCurrencyCode!: string;

  @Column({ name: 'purpose_description', type: 'text', nullable: true })
  purposeDescription?: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'DRAFT' })
  status!: IncomingReceiptStatus;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date | null;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt?: Date | null;

  @Column({
    name: 'received_amount',
    type: 'decimal',
    precision: 20,
    scale: 4,
    nullable: true,
  })
  receivedAmount?: string | null;

  @Column({ name: 'received_currency_code', type: 'char', length: 3, nullable: true })
  receivedCurrencyCode?: string | null;

  @Column({ name: 'inward_bank_reference', type: 'varchar', length: 100, nullable: true })
  inwardBankReference?: string | null;

  @Column({ name: 'received_remarks', type: 'text', nullable: true })
  receivedRemarks?: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string | null;

  @OneToMany(() => IncomingReceiptDocument, (d) => d.incomingReceipt, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  documents?: IncomingReceiptDocument[];
}
