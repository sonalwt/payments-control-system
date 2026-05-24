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
import { PaymentRequest } from './payment-request.entity';

/**
 * SOW §3 — Supporting documents attached to a payment request.
 *
 * Stores metadata only; actual file bytes live in the configured
 * object store (or are represented as a URL / relative path).
 */
@Entity({ name: 'payment_request_documents' })
@Index('idx_prd_request', ['paymentRequestId'])
export class PaymentRequestDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'payment_request_id', type: 'uuid' })
  paymentRequestId!: string;

  @ManyToOne(() => PaymentRequest, (pr) => pr.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest!: PaymentRequest;

  /** Matches a code in the payment type's documentPolicy JSONB array. */
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

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
