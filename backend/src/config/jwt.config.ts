import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  /** Session length for passwordless employee-portal tokens. */
  employeeExpiresIn: string;
  /** Lifetime of an emailed login OTP, in minutes. */
  otpTtlMinutes: number;
  /** Wrong-code attempts allowed before an OTP is locked. */
  otpMaxAttempts: number;
}

export default registerAs<JwtConfig>('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'change_me_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  employeeExpiresIn: process.env.EMPLOYEE_JWT_EXPIRES_IN ?? '2h',
  otpTtlMinutes: parseInt(process.env.EMPLOYEE_OTP_TTL_MINUTES ?? '10', 10),
  otpMaxAttempts: parseInt(process.env.EMPLOYEE_OTP_MAX_ATTEMPTS ?? '5', 10),
}));
