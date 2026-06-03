import { registerAs } from '@nestjs/config';

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export default registerAs<MailConfig>('mail', () => ({
  host: process.env.SMTP_HOST ?? '',
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  // Use TLS-on-connect for port 465; STARTTLS otherwise.
  secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  from: process.env.MAIL_FROM ?? 'Payments Control System <no-reply@pcs.local>',
}));
