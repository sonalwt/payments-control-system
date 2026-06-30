import { registerAs } from '@nestjs/config';

/**
 * Foreign-exchange configuration (SOW §2.2).
 *
 * USD is the group reporting currency; daily rates are fetched from OANDA and
 * abstracted behind {@link FxRateProvider} so the provider can be swapped
 * without rework. Where the feed is unavailable the system holds the previous
 * day's rate (marked stale) until an administrator overrides it.
 */
export interface FxConfig {
  /** Group reporting currency — base of every stored rate. */
  reportingCurrency: string;
  /** Cron expression for the daily auto-fetch (defaults to 06:00 Dubai). */
  fetchCron: string;
  /** When false, the scheduled fetch is skipped (manual fetch still works). */
  scheduleEnabled: boolean;
  oanda: {
    baseUrl: string;
    apiKey: string;
  };
}

export default registerAs<FxConfig>('fx', () => ({
  reportingCurrency: (process.env.FX_REPORTING_CURRENCY ?? 'USD').toUpperCase(),
  // Daily at 06:00 Dubai time — OANDA publishes the prior session by then.
  fetchCron: process.env.FX_FETCH_CRON ?? '0 6 * * *',
  scheduleEnabled: process.env.FX_SCHEDULE_ENABLED !== 'false',
  oanda: {
    baseUrl:
      process.env.OANDA_API_URL ?? 'https://web-services.oanda.com/rates/api/v2',
    apiKey: process.env.OANDA_API_KEY ?? '',
  },
}));
