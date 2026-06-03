import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
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
  ) {}

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
    const user = await this.users.findByEmailWithPassword(dto.email);
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
        email: user.email,
        fullName: user.fullName,
        roles,
      },
    };
  }

  /**
   * Begin a password reset. Always resolves the same way regardless of whether
   * the email exists, to avoid leaking which addresses are registered.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user || !user.isActive) return;

    const payload: ResetTokenPayload = {
      sub: user.id,
      type: 'pwreset',
      v: this.hashBinding(user.passwordHash),
    };
    const token = await this.jwt.signAsync(payload, {
      secret: this.resetSecret(),
      expiresIn: '1h',
    });

    const frontendUrl = this.config.getOrThrow<string>('app.frontendUrl').replace(/\/$/, '');
    const link = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mail.sendPasswordReset(user.email, link);
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
