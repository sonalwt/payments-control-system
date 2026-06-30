import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Employee } from '../employees/employee.entity';
import { EmployeeLoginOtp } from './employee-otp.entity';
import { MailService } from '../mail/mail.service';
import { EmployeeLoginResponseDto } from './dto/verify-otp.dto';
import { EmployeeJwtPayload, employeeJwtSecret } from './employee-jwt.strategy';

@Injectable()
export class EmployeeAuthService {
  private readonly logger = new Logger(EmployeeAuthService.name);

  constructor(
    @InjectRepository(Employee) private readonly employees: Repository<Employee>,
    @InjectRepository(EmployeeLoginOtp) private readonly otps: Repository<EmployeeLoginOtp>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
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

  /**
   * Issue a login code to the employee's work email. Always resolves the same
   * way whether or not the email maps to an active employee, so the endpoint
   * never reveals which addresses exist.
   */
  async requestOtp(workEmail: string): Promise<void> {
    const employee = await this.employees.findOne({ where: { workEmail } });
    if (!employee || !employee.isActive) return;

    // 6-digit code, zero-padded. crypto.randomInt avoids Math.random bias.
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const ttlMinutes = this.config.getOrThrow<number>('jwt.otpTtlMinutes');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    // Supersede any still-live codes so only the newest one can be redeemed.
    await this.otps.update(
      { employeeId: employee.id, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );

    await this.otps.save(
      this.otps.create({
        employeeId: employee.id,
        codeHash: this.hashCode(code),
        expiresAt,
        attempts: 0,
      }),
    );

    await this.mail.sendEmployeeOtp(employee.workEmail, code, ttlMinutes);
  }

  /** Redeem a login code and return an employee-realm access token. */
  async verifyOtp(workEmail: string, code: string): Promise<EmployeeLoginResponseDto> {
    const invalid = () => new UnauthorizedException('Invalid or expired code');

    const employee = await this.employees.findOne({ where: { workEmail } });
    if (!employee || !employee.isActive) throw invalid();

    const otp = await this.otps.findOne({
      where: { employeeId: employee.id, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!otp) throw invalid();

    if (otp.expiresAt.getTime() <= Date.now()) throw invalid();

    const maxAttempts = this.config.getOrThrow<number>('jwt.otpMaxAttempts');
    if (otp.attempts >= maxAttempts) {
      // Burn the code so a locked-out attacker can't keep guessing.
      await this.otps.update(otp.id, { consumedAt: new Date() });
      throw new BadRequestException('Too many attempts. Please request a new code.');
    }

    if (!this.hashesEqual(otp.codeHash, this.hashCode(code))) {
      await this.otps.update(otp.id, { attempts: otp.attempts + 1 });
      throw invalid();
    }

    // Success — single-use: consume the code.
    await this.otps.update(otp.id, { consumedAt: new Date() });

    const expiresIn = this.config.getOrThrow<string>('jwt.employeeExpiresIn');
    const payload: EmployeeJwtPayload = {
      sub: employee.id,
      workEmail: employee.workEmail,
      name: employee.fullName,
      realm: 'employee',
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: employeeJwtSecret(this.config.getOrThrow<string>('jwt.secret')),
      expiresIn,
    });

    return {
      accessToken,
      expiresIn,
      employee: {
        id: employee.id,
        workEmail: employee.workEmail,
        fullName: employee.fullName,
      },
    };
  }
}
