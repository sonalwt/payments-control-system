import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FxConfig } from '../../../config/fx.config';
import {
  FxRateProvider,
  ProviderRate,
} from './fx-rate-provider.interface';

/**
 * OANDA Exchange Rates API (v2) implementation of {@link FxRateProvider}.
 *
 * Reads `1 base → quote` midpoints. When no API key is configured (typical in
 * dev), or the upstream call fails, it raises ServiceUnavailable so the service
 * holds the previous day's rate forward rather than recording a bad value.
 */
@Injectable()
export class OandaFxRateProvider implements FxRateProvider {
  readonly name = 'OANDA';
  private readonly logger = new Logger(OandaFxRateProvider.name);

  constructor(private readonly config: ConfigService) {}

  async fetchRates(
    baseCurrencyCode: string,
    quoteCurrencyCodes: string[],
    asOfDate: string,
  ): Promise<ProviderRate[]> {
    const fx = this.config.getOrThrow<FxConfig>('fx');
    if (!fx.oanda.apiKey) {
      throw new ServiceUnavailableException(
        'OANDA API key is not configured (OANDA_API_KEY).',
      );
    }
    if (quoteCurrencyCodes.length === 0) return [];

    const params = new URLSearchParams();
    params.set('base', baseCurrencyCode);
    for (const q of quoteCurrencyCodes) params.append('quote', q);
    params.set('date', asOfDate);
    params.set('fields', 'midpoint');
    const url = `${fx.oanda.baseUrl}/rates/spot.json?${params.toString()}`;

    let body: OandaResponse;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${fx.oanda.apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        throw new Error(`OANDA responded ${res.status} ${res.statusText}`);
      }
      body = (await res.json()) as OandaResponse;
    } catch (err) {
      this.logger.warn(
        `OANDA fetch failed for ${baseCurrencyCode} (${asOfDate}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new ServiceUnavailableException('OANDA rate feed unavailable.');
    }

    const out: ProviderRate[] = [];
    for (const q of body.quotes ?? []) {
      const code = q.quote_currency?.toUpperCase();
      const mid = q.midpoint;
      if (code && mid != null && Number.isFinite(Number(mid))) {
        out.push({ quoteCurrencyCode: code, rate: String(mid) });
      }
    }
    return out;
  }
}

interface OandaResponse {
  quotes?: Array<{
    base_currency?: string;
    quote_currency?: string;
    midpoint?: string | number;
  }>;
}
