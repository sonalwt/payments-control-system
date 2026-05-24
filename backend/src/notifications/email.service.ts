import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST not configured — email delivery is disabled');
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: this.config.get<boolean>('SMTP_SECURE') ?? false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(opts: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`Email skipped (SMTP not configured): ${opts.subject}`);
      return;
    }
    const from =
      this.config.get<string>('SMTP_FROM') ?? 'no-reply@payments-control-system.local';
    try {
      await this.transporter.sendMail({ from, ...opts });
      const recipients = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to;
      this.logger.log(`Email sent → ${recipients}: "${opts.subject}"`);
    } catch (err) {
      this.logger.error(`Failed to send email "${opts.subject}"`, err);
    }
  }
}
