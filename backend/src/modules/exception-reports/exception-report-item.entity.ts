import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExceptionReport } from './exception-report.entity';

@Entity({ name: 'exception_report_items' })
export class ExceptionReportItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'report_id' })
  reportId!: string;

  @ManyToOne(() => ExceptionReport, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report!: ExceptionReport;

  @Column({ name: 'payment_request_id' })
  paymentRequestId!: string;

  @Column({ name: 'request_number', length: 30 })
  requestNumber!: string;

  @Column({ name: 'legal_entity_name', type: 'varchar', length: 200, nullable: true })
  legalEntityName!: string | null;

  @Column({ name: 'currency_code', length: 10 })
  currencyCode!: string;

  @Column({ name: 'amount', type: 'numeric', precision: 20, scale: 6 })
  amount!: string;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
