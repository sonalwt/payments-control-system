import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExceptionReportItem } from './exception-report-item.entity';

@Entity({ name: 'exception_reports' })
export class ExceptionReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Calendar date this report covers (paid_at::date). */
  @Column({ type: 'date', name: 'report_date', unique: true })
  reportDate!: string;

  @Column({ name: 'total_missing', default: 0 })
  totalMissing!: number;

  @Column({ name: 'generated_at', type: 'timestamptz', default: () => 'now()' })
  generatedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => ExceptionReportItem, (i) => i.report, { cascade: ['insert'] })
  items?: ExceptionReportItem[];
}
