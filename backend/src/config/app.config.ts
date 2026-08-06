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
  /**
   * Email of the PCS user that integration-created payment requests are
   * attributed to. That user must be configured as the Maker for every payment
   * type the invoicing app raises, exactly like a human maker — the webhook
   * gets no privilege the UI does not.
   */
  integrationMakerEmail: string;
  /**
   * Payment category that invoices from the integration belong to. A maker
   * classifying an integration draft may only pick a payment type in this
   * category, so an inbound invoice can never be routed down an unrelated
   * approval chain. Matched on the payment_categories.name (that table has no
   * code column).
   */
  integrationPaymentCategory: string;
}

export default registerAs<AppConfig>('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  // Public base URL of the frontend, used to build links in emails.
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  integrationMakerEmail: process.env.INTEGRATION_MAKER_EMAIL ?? '',
  integrationPaymentCategory: process.env.INTEGRATION_PAYMENT_CATEGORY ?? 'Trade Payments',
}));
