import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { IncomingReceiptDocument } from './incoming-receipt-document.entity';

/** SoW §7 — incoming receipt status machine. */
export type IncomingReceiptStatus =
  | 'DRAFT'
  | 'AWAITING_RECEIPT'
  | 'RECEIVED'
  | 'CANCELLED';

/**
 * SoW §7 — Incoming Receipts.
 * Inbound counterpart of outgoing payments. Records an amount the group
 * expects to receive from a counterparty and confirms it against the bank
 * credit. Incoming receipts do not pass through an approval chain (§7.2).
 */
@Entity({ name: 'incoming_receipts' })
export class IncomingReceipt extends BaseEntity {
  @Column({ name: 'receipt_number', type: 'varchar', length: 30, unique: true })
  receiptNumber!: string;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @ManyToOne(() => LegalEntity)
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity?: LegalEntity;

  @Column({ name: 'counterparty_id', type: 'uuid' })
  counterpartyId!: string;

  @ManyToOne(() => Counterparty)
  @JoinColumn({ name: 'counterparty_id' })
  counterparty?: Counterparty;

  @Column({ name: 'receive_from_account_id', type: 'uuid' })
  receiveFromAccountId!: string;

  @ManyToOne(() => BankAccount)
  @JoinColumn({ name: 'receive_from_account_id' })
  receiveFromAccount?: BankAccount;

  @Column({ name: 'expected_amount', type: 'decimal', precision: 20, scale: 4 })
  expectedAmount!: string;

  @Column({ name: 'expected_currency_code', type: 'varchar', length: 10 })
  expectedCurrencyCode!: string;

  @Column({ name: 'purpose_description', type: 'text', nullable: true })
  purposeDescription?: string | null;

  /** Optional free-text note of the counterparty account the credit comes from. */
  @Column({ name: 'received_from_account', type: 'varchar', length: 200, nullable: true })
  receivedFromAccount?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  status!: IncomingReceiptStatus;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date | null;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt?: Date | null;

  @Column({ name: 'received_amount', type: 'decimal', precision: 20, scale: 4, nullable: true })
  receivedAmount?: string | null;

  @Column({ name: 'received_currency_code', type: 'varchar', length: 10, nullable: true })
  receivedCurrencyCode?: string | null;

  @Column({ name: 'inward_bank_reference', type: 'varchar', length: 140, nullable: true })
  inwardBankReference?: string | null;

  @Column({ name: 'received_remarks', type: 'text', nullable: true })
  receivedRemarks?: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string | null;

  @OneToMany(() => IncomingReceiptDocument, (d) => d.incomingReceipt)
  documents?: IncomingReceiptDocument[];
}
