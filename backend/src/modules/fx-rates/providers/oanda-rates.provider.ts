import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FxConfig } from '../../../config/fx.config';
import {
  IRatesProvider,
  ProviderRate,
  RatesProviderResult,
} from './rates-provider.interface';

/**
 * Default {@link IRatesProvider} backed by the OANDA Exchange Rates API
 * (v2 spot endpoint). Returns mid-points of `base 1 → quote`.
 *
 * Network/credential failures throw, which the service interprets as
 * "feed unavailable" and falls back to holding the previous day's rate (§2.2).
 */
@Injectable()
export class OandaRatesProvider implements IRatesProvider {
  readonly name = 'OANDA';
  private readonly logger = new Logger(OandaRatesProvider.name);
  private readonly cfg: FxConfig;

  constructor(config: ConfigService) {
    this.cfg = config.getOrThrow<FxConfig>('fx');
  }

  async fetchRates(
    baseCurrencyCode: string,
    quoteCurrencyCodes: string[],
    asOfDate: string,
  ): Promise<RatesProviderResult> {
    if (!this.cfg.oandaApiKey) {
      // No credential configured (e.g. local dev) — surface as feed-unavailable
      // so the caller holds stale rather than recording bogus values.
      throw new Error('OANDA_API_KEY is not configured');
    }

    const url = new URL(this.cfg.oandaApiUrl);
    url.searchParams.set('base', baseCurrencyCode);
    for (const q of quoteCurrencyCodes) url.searchParams.append('quote', q);
    url.searchParams.set('fields', 'midpoint');
    url.searchParams.set('decimal_places', '10');
    url.searchParams.set('api_key', this.cfg.oandaApiKey);

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(this.cfg.requestTimeoutMs),
    });
    if (!res.ok) {
      throw new Error(`OANDA responded with HTTP ${res.status}`);
    }

    const body = (await res.json()) as OandaSpotResponse;
    const quotes = Array.isArray(body.quotes) ? body.quotes : [];
    const rates: ProviderRate[] = [];
    for (const q of quotes) {
      const quote = (q.quote_currency ?? '').toUpperCase();
      const rate = q.midpoint ?? q.rate;
      if (!quote || rate == null || rate === '') continue;
      rates.push({ quoteCurrencyCode: quote, rate: String(rate) });
    }

    this.logger.log(
      `OANDA returned ${rates.length}/${quoteCurrencyCodes.length} quotes for ${baseCurrencyCode} as of ${asOfDate}`,
    );
    return { baseCurrencyCode, asOfDate, rates };
  }
}

interface OandaSpotResponse {
  base_currency?: string;
  quotes?: Array<{
    quote_currency?: string;
    midpoint?: string;
    rate?: string;
  }>;
}
