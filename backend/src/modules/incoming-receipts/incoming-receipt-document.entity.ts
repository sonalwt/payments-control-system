import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncomingReceipt } from './incoming-receipt.entity';

/**
 * SoW §7.1 — supporting documents for an incoming receipt
 * (debit note or final invoice shared with the counterparty).
 */
@Entity({ name: 'incoming_receipt_documents' })
export class IncomingReceiptDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'incoming_receipt_id', type: 'uuid' })
  incomingReceiptId!: string;

  @ManyToOne(() => IncomingReceipt, (r) => r.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incoming_receipt_id' })
  incomingReceipt?: IncomingReceipt;

  @Column({ name: 'document_code', type: 'varchar', length: 50 })
  documentCode!: string;

  @Column({ name: 'document_label', type: 'varchar', length: 200, nullable: true })
  documentLabel?: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl!: string;

  @Column({ name: 'file_size_bytes', type: 'integer', nullable: true })
  fileSizeBytes?: number | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType?: string | null;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy?: string | null;

  @Column({ name: 'uploaded_at', type: 'timestamptz', default: () => 'now()' })
  uploadedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
