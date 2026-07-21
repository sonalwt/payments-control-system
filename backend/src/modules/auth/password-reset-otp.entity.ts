import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

/**
 * A single password-reset OTP tied to a user. The 6-digit code is emailed to
 * an administrator (never the user); only its SHA-256 hash is persisted here.
 * Codes are short-lived, single-use, and attempt-capped. Once verified, the
 * caller is issued a short-lived reset token to set a new password.
 */
@Entity({ name: 'password_reset_otps' })
export class PasswordResetOtp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

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
