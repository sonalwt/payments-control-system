import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { PasswordResetOtp } from './password-reset-otp.entity';
import { JwtPayload } from './jwt.strategy';

/** Payload of a single-use password-reset token. */
interface ResetTokenPayload {
  sub: string;
  type: 'pwreset';
  /** Binding to the current password hash so the token is invalidated once used. */
  v: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    @InjectRepository(PasswordResetOtp)
    private readonly resetOtps: Repository<PasswordResetOtp>,
  ) {}

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /** Constant-time comparison of two equal-length hex digests. */
  private hashesEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  }

  /** Secret for reset tokens — derived from, but distinct from, the auth JWT
   *  secret so a reset token can never be used as an API bearer token. */
  private resetSecret(): string {
    return `${this.config.getOrThrow<string>('jwt.secret')}::pwreset`;
  }

  /** Short fingerprint of a password hash, used to make reset tokens single-use. */
  private hashBinding(passwordHash: string): string {
    return crypto.createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users.findByUsernameWithPassword(dto.username);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.fullName,
    };
    const expiresIn = this.config.getOrThrow<string>('jwt.expiresIn');
    const accessToken = await this.jwt.signAsync(payload, { expiresIn });
    await this.users.touchLastLogin(user.id);
    const { roles } = await this.users.loadRoleCodes(user.id);
    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles,
      },
    };
  }

  /**
   * Begin a password reset. Generates a one-time code and emails it to an
   * administrator (never the requesting user) for them to relay. Always
   * resolves the same way regardless of whether the email exists, to avoid
   * leaking which addresses are registered.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user || !user.isActive) return;

    // 6-digit code, zero-padded. crypto.randomInt avoids Math.random bias.
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const ttlMinutes = this.config.getOrThrow<number>('jwt.otpTtlMinutes');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    // Supersede any still-live codes so only the newest one can be redeemed.
    await this.resetOtps.update(
      { userId: user.id, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );

    await this.resetOtps.save(
      this.resetOtps.create({
        userId: user.id,
        codeHash: this.hashCode(code),
        expiresAt,
        attempts: 0,
      }),
    );

    // Reset codes always go to an admin. Prefer a configured address; fall
    // back to every active platform admin so the flow works out of the box.
    const configured = this.config.get<string>('app.adminEmail');
    const recipients = configured
      ? [configured]
      : await this.users.findPlatformAdminEmails();
    if (recipients.length === 0) return;

    await this.mail.sendPasswordResetOtp(recipients, code, ttlMinutes, user.email);
  }

  /**
   * Verify a reset OTP and, on success, issue a short-lived reset token that
   * unlocks the reset-password window. Codes are single-use and attempt-capped.
   */
  async verifyResetOtp(email: string, code: string): Promise<{ token: string }> {
    const invalid = () => new BadRequestException('Invalid or expired code');

    const user = await this.users.findByEmailWithPassword(email);
    if (!user || !user.isActive) throw invalid();

    const otp = await this.resetOtps.findOne({
      where: { userId: user.id, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!otp) throw invalid();

    if (otp.expiresAt.getTime() <= Date.now()) throw invalid();

    const maxAttempts = this.config.getOrThrow<number>('jwt.otpMaxAttempts');
    if (otp.attempts >= maxAttempts) {
      // Burn the code so a locked-out attacker can't keep guessing.
      await this.resetOtps.update(otp.id, { consumedAt: new Date() });
      throw new BadRequestException('Too many attempts. Please request a new code.');
    }

    if (!this.hashesEqual(otp.codeHash, this.hashCode(code))) {
      await this.resetOtps.update(otp.id, { attempts: otp.attempts + 1 });
      throw invalid();
    }

    // Success — single-use: consume the code.
    await this.resetOtps.update(otp.id, { consumedAt: new Date() });

    const payload: ResetTokenPayload = {
      sub: user.id,
      type: 'pwreset',
      v: this.hashBinding(user.passwordHash),
    };
    const token = await this.jwt.signAsync(payload, {
      secret: this.resetSecret(),
      expiresIn: '1h',
    });
    return { token };
  }

  /** Complete a password reset using a token from the emailed link. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: ResetTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<ResetTokenPayload>(token, {
        secret: this.resetSecret(),
      });
    } catch {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }
    if (payload.type !== 'pwreset') {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const user = await this.users.findByIdWithPassword(payload.sub);
    if (!user || !user.isActive) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }
    // Single-use: the binding no longer matches once the password has changed.
    if (payload.v !== this.hashBinding(user.passwordHash)) {
      throw new BadRequestException('This reset link has already been used or has expired.');
    }

    await this.users.setPassword(user.id, newPassword);
  }
}
