import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { User } from '../users/user.entity';

/**
 * SoW §4.1 — supporting documents per payment request.
 * document_code matches an entry in the payment type's document_policy.
 * Service-layer logic enforces the required set on submit.
 */
@Entity({ name: 'payment_request_documents' })
export class PaymentRequestDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'payment_request_id', type: 'uuid' })
  paymentRequestId!: string;

  @ManyToOne(() => PaymentRequest, (pr) => pr.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest?: PaymentRequest;

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

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByUser?: User | null;

  @Column({ name: 'uploaded_at', type: 'timestamptz', default: () => 'now()' })
  uploadedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
