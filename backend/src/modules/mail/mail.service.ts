import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { MailConfig } from '../../config/mail.config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;
    const mail = this.config.getOrThrow<MailConfig>('mail');
    if (!mail.host) {
      this.logger.warn('SMTP is not configured (SMTP_HOST is empty); emails will not be sent.');
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });
    return this.transporter;
  }

  /**
   * Send a password-reset email. Failures are logged but not thrown so the
   * caller can keep its response identical whether or not the address exists.
   */
  async sendPasswordReset(to: string, resetLink: string): Promise<void> {
    const mail = this.config.getOrThrow<MailConfig>('mail');
    const transporter = this.getTransporter();

    if (!transporter) {
      // Dev fallback so the flow is testable without SMTP credentials.
      this.logger.warn(`Password reset link for ${to}: ${resetLink}`);
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: mail.from,
        to,
        subject: 'Reset your Payments Control System password',
        text:
          `We received a request to reset your password.\n\n` +
          `Open this link to choose a new password (valid for 1 hour):\n${resetLink}\n\n` +
          `If you did not request this, you can safely ignore this email.`,
        html:
          `<p>We received a request to reset your password.</p>` +
          `<p><a href="${resetLink}">Click here to choose a new password</a> (valid for 1 hour).</p>` +
          `<p>If you did not request this, you can safely ignore this email.</p>`,
      });
      this.logger.log(
        `Password reset email accepted for ${to} (messageId=${info.messageId}, ` +
          `accepted=${JSON.stringify(info.accepted)}, response=${info.response})`,
      );
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}`, err as Error);
    }
  }
}
