import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FxRate, FxRateSource } from './fx-rate.entity';
import { FxRatesRepository } from './fx-rates.repository';
import { CurrenciesService } from '../currencies/currencies.service';
import {
  IRatesProvider,
  RATES_PROVIDER,
} from './providers/rates-provider.interface';
import { OverrideFxRateDto } from './dto/override-fx-rate.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

export interface ResolvedRate {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: string;
  asOfDate: string;
  effectiveAsOfDate: string;
  source: FxRateSource;
  isStale: boolean;
  lastUpdated: Date;
  providerName: string | null;
  overrideReason: string | null;
}

interface FxRateQuery extends PaginationQueryDto {
  base?: string;
  quote?: string;
  asOfDate?: string;
}

@Injectable()
export class FxRatesService {
  private readonly logger = new Logger(FxRatesService.name);
  /** Group reporting currency per SOW §2.1. */
  static readonly REPORTING_CURRENCY = 'USD';

  constructor(
    private readonly repo: FxRatesRepository,
    private readonly currencies: CurrenciesService,
    @Inject(RATES_PROVIDER) private readonly provider: IRatesProvider,
  ) {}

  /**
   * Resolve the rate to use for (base, quote) on the given as-of date.
   *
   * Identity (base == quote) short-circuits to 1.0. Otherwise the most
   * recent persisted row on/before `asOfDate` is returned; `isStale` is
   * true when the persisted row's date is older than `asOfDate` or its
   * source is STALE_HELD.
   */
  async getRate(
    quoteCode: string,
    asOfDate?: string,
    baseCode = FxRatesService.REPORTING_CURRENCY,
  ): Promise<ResolvedRate> {
    const base = baseCode.toUpperCase();
    const quote = quoteCode.toUpperCase();
    const asOf = asOfDate ?? new Date().toISOString().slice(0, 10);

    if (base === quote) {
      return {
        baseCurrencyCode: base,
        quoteCurrencyCode: quote,
        rate: '1.0000000000',
        asOfDate: asOf,
        effectiveAsOfDate: asOf,
        source: 'OANDA',
        isStale: false,
        lastUpdated: new Date(),
        providerName: 'IDENTITY',
        overrideReason: null,
      };
    }

    const row = await this.repo.findLatestOnOrBefore(base, quote, asOf);
    if (!row) {
      throw new NotFoundException(
        `No FX rate available for ${base}/${quote} on or before ${asOf}. ` +
          `Run a fetch or record a manual override.`,
      );
    }
    const isStale = row.asOfDate !== asOf || row.source === 'STALE_HELD';
    return {
      baseCurrencyCode: row.baseCurrencyCode,
      quoteCurrencyCode: row.quoteCurrencyCode,
      rate: row.rate,
      asOfDate: row.asOfDate,
      effectiveAsOfDate: asOf,
      source: row.source,
      isStale,
      lastUpdated: row.fetchedAt,
      providerName: row.providerName ?? null,
      overrideReason: row.overrideReason ?? null,
    };
  }

  /**
   * Pull rates from the configured provider and persist them. For any
   * active quote currency the provider does not return, the previous
   * day's rate is carried forward as a STALE_HELD row so reads stay
   * resilient when the feed is partially down.
   */
  async fetchDaily(
    asOfDate?: string,
    baseCode = FxRatesService.REPORTING_CURRENCY,
  ): Promise<{
    fetched: number;
    heldStale: number;
    asOfDate: string;
    providerName: string;
  }> {
    const base = baseCode.toUpperCase();
    const asOf = asOfDate ?? new Date().toISOString().slice(0, 10);

    // All active currencies excluding the base.
    const activeCurrencies = await this.currencies.findAll({
      page: 1,
      limit: 200,
      isActive: 'true',
    });
    const quoteCodes = activeCurrencies.data
      .map((c) => c.code)
      .filter((c) => c !== base);

    let fetchedRows: Awaited<ReturnType<IRatesProvider['fetchDailyRates']>> = [];
    try {
      fetchedRows = await this.provider.fetchDailyRates(base, quoteCodes, asOf);
    } catch (err) {
      this.logger.error(
        `Provider ${this.provider.providerName} failed for ${asOf}: ${(err as Error).message}`,
      );
      fetchedRows = [];
    }

    const fetchedSet = new Set<string>();
    let fetched = 0;
    for (const r of fetchedRows) {
      const quote = r.quoteCurrencyCode.toUpperCase();
      fetchedSet.add(quote);
      await this.upsert({
        baseCurrencyCode: base,
        quoteCurrencyCode: quote,
        rate: r.rate,
        asOfDate: r.asOfDate,
        source: 'OANDA',
        providerName: this.provider.providerName,
        overrideReason: null,
      });
      fetched += 1;
    }

    let heldStale = 0;
    for (const quote of quoteCodes) {
      if (fetchedSet.has(quote)) continue;
      const existsForDate = await this.repo.findExact(base, quote, asOf);
      if (existsForDate) continue; // manual override or earlier fetch wins
      const prev = await this.repo.findLatestOnOrBefore(base, quote, asOf);
      if (!prev) continue;
      await this.upsert({
        baseCurrencyCode: base,
        quoteCurrencyCode: quote,
        rate: prev.rate,
        asOfDate: asOf,
        source: 'STALE_HELD',
        providerName: this.provider.providerName,
        overrideReason: null,
      });
      heldStale += 1;
    }

    return { fetched, heldStale, asOfDate: asOf, providerName: this.provider.providerName };
  }

  /** Admin manual override for a (base, quote, date). Audited at controller. */
  async overrideRate(
    dto: OverrideFxRateDto,
    userId: string,
  ): Promise<FxRate> {
    if (Number(dto.rate) <= 0) {
      throw new BadRequestException('Rate must be greater than zero.');
    }
    const asOf = dto.asOfDate ?? new Date().toISOString().slice(0, 10);
    return this.upsert(
      {
        baseCurrencyCode: dto.baseCurrencyCode.toUpperCase(),
        quoteCurrencyCode: dto.quoteCurrencyCode.toUpperCase(),
        rate: dto.rate,
        asOfDate: asOf,
        source: 'MANUAL_OVERRIDE',
        providerName: null,
        overrideReason: dto.reason,
      },
      userId,
    );
  }

  async list(query: FxRateQuery): Promise<PaginatedResult<FxRate>> {
    const { page = 1, limit = 50, base, quote, asOfDate } = query;
    const where: Record<string, unknown> = {};
    if (base) where.baseCurrencyCode = base.toUpperCase();
    if (quote) where.quoteCurrencyCode = quote.toUpperCase();
    if (asOfDate) where.asOfDate = asOfDate;
    const [data, total] = await this.repo.raw.findAndCount({
      where: Object.keys(where).length ? where : undefined,
      order: { asOfDate: 'DESC', quoteCurrencyCode: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async upsert(
    data: {
      baseCurrencyCode: string;
      quoteCurrencyCode: string;
      rate: string;
      asOfDate: string;
      source: FxRateSource;
      providerName: string | null;
      overrideReason: string | null;
    },
    userId?: string,
  ): Promise<FxRate> {
    const existing = await this.repo.findExact(
      data.baseCurrencyCode,
      data.quoteCurrencyCode,
      data.asOfDate,
    );
    if (existing) {
      existing.rate = data.rate;
      existing.source = data.source;
      existing.fetchedAt = new Date();
      existing.providerName = data.providerName;
      existing.overrideReason = data.overrideReason;
      if (userId) existing.updatedBy = userId;
      return this.repo.save(existing);
    }
    const entity = this.repo.create({
      ...data,
      fetchedAt: new Date(),
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    });
    return this.repo.save(entity);
  }
}
