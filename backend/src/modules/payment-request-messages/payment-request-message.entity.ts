import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentRequest } from '../payment-requests/payment-request.entity';
import { User } from '../users/user.entity';

export interface MessageAttachment {
  url: string;
  fileName: string;
}

@Entity({ name: 'payment_request_messages' })
export class PaymentRequestMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'payment_request_id', type: 'uuid' })
  paymentRequestId!: string;

  @ManyToOne(() => PaymentRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest?: PaymentRequest;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'sender_id' })
  sender?: User;

  /** The user this message is directed to. Both sender and recipient can read it. */
  @Column({ name: 'recipient_id', type: 'uuid', nullable: true })
  recipientId?: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', eager: false, nullable: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient?: User | null;

  @Column({ type: 'text' })
  message!: string;

  /** Array of { url, fileName } objects attached to this message. */
  @Column({ type: 'jsonb', default: [] })
  attachments!: MessageAttachment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
