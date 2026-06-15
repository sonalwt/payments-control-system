import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';

/**
 * A single passwordless login code emailed to an employee's work_email.
 * Only the SHA-256 hash of the 6-digit code is stored; the plaintext is
 * never persisted. Codes are short-lived, single-use, and attempt-capped.
 */
@Entity({ name: 'employee_login_otps' })
export class EmployeeLoginOtp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @Column({ name: 'code_hash', type: 'varchar', length: 255 })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  /** Set once the code is redeemed, making it single-use. */
  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt?: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
