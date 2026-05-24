import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FetchedRate,
  IRatesProvider,
} from './rates-provider.interface';

/**
 * OANDA Exchange Rates API client (SOW §2.2).
 *
 * If `OANDA_API_KEY` / `OANDA_BASE_URL` are not configured the provider
 * returns no rates (the caller will fall back to the previous day's
 * STALE_HELD entry). This keeps the system usable in environments without
 * outbound network access (CI, local dev) without changing call sites.
 */
@Injectable()
export class OandaRatesProvider implements IRatesProvider {
  readonly providerName = 'OANDA';
  private readonly logger = new Logger(OandaRatesProvider.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('OANDA_API_KEY');
    this.baseUrl =
      config.get<string>('OANDA_BASE_URL') ??
      'https://www.oanda.com/rates/api/v2/rates/spot.json';
  }

  async fetchDailyRates(
    baseCode: string,
    quoteCodes: string[],
    asOfDate?: string,
  ): Promise<FetchedRate[]> {
    if (!this.apiKey) {
      this.logger.warn(
        'OANDA_API_KEY not configured — skipping live fetch; system will hold previous day rates.',
      );
      return [];
    }
    const date = asOfDate ?? new Date().toISOString().slice(0, 10);
    const url = new URL(this.baseUrl);
    url.searchParams.set('base', baseCode);
    url.searchParams.set('quote', quoteCodes.join(','));
    url.searchParams.set('data_set', 'OANDA');
    url.searchParams.set('date', date);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error(
        `OANDA fetch failed: HTTP ${res.status} ${res.statusText}`,
      );
    }
    const body = (await res.json()) as {
      quotes?: Array<{ quote_currency: string; midpoint: string }>;
    };
    const quotes = body.quotes ?? [];
    return quotes.map((q) => ({
      quoteCurrencyCode: q.quote_currency,
      rate: q.midpoint,
      asOfDate: date,
    }));
  }
}
