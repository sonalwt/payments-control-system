import { registerAs } from '@nestjs/config';

export interface FxConfig {
  /** Group reporting / default base currency (§2.1). */
  baseCurrency: string;
  /** Active rates provider name (only OANDA is implemented in this scope). */
  provider: string;
  /** OANDA Exchange Rates API spot endpoint. */
  oandaApiUrl: string;
  /** OANDA API key. Empty in local dev → daily fetch holds previous rates. */
  oandaApiKey: string;
  /** Outbound request timeout for the provider, milliseconds. */
  requestTimeoutMs: number;
}

export default registerAs<FxConfig>('fx', () => ({
  baseCurrency: (process.env.FX_BASE_CURRENCY ?? 'USD').toUpperCase(),
  provider: process.env.FX_PROVIDER ?? 'OANDA',
  oandaApiUrl:
    process.env.OANDA_API_URL ??
    'https://www.oanda.com/rates/api/v2/rates/spot.json',
  oandaApiKey: process.env.OANDA_API_KEY ?? '',
  requestTimeoutMs: parseInt(process.env.FX_REQUEST_TIMEOUT_MS ?? '15000', 10),
}));
