import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  frontendUrl: string;
  /**
   * Fixed recipient for password-reset OTP emails. When empty, the OTP is
   * sent to every active platform admin instead. Password-reset codes are
   * always delivered to an admin, never to the requesting user.
   */
  adminEmail: string;
}

export default registerAs<AppConfig>('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  // Public base URL of the frontend, used to build links in emails.
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
}));
