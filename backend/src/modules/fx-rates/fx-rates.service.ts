import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FxConfig } from '../../config/fx.config';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { Currency } from '../currencies/currency.entity';
import { FxRate, FxRateSource } from './fx-rate.entity';
import { OverrideFxRateDto } from './dto/override-fx-rate.dto';
import { QueryFxRateDto } from './dto/query-fx-rate.dto';
import {
  IRatesProvider,
  RATES_PROVIDER,
} from './providers/rates-provider.interface';

export interface FetchResult {
  fetched: number;
  heldStale: number;
  asOfDate: string;
  providerName: string;
}

/**
 * A rate resolved for use elsewhere (USD-equivalent dashboards §2.1/§13,
 * indicative cross-currency min-balance check §2.6). Carries staleness so
 * consumers can show the "stale rate, last updated [date]" indicator (§2.2).
 */
export interface ResolvedFxRate {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: string;
  /** Date the caller asked about (YYYY-MM-DD). */
  asOfDate: string;
  /** Date of the row actually used (≤ asOfDate). */
  effectiveAsOfDate: string;
  source: FxRateSource;
  isStale: boolean;
  lastUpdated: string;
  providerName: string | null;
  overrideReason: string | null;
}

@Injectable()
export class FxRatesService {
  private readonly logger = new Logger(FxRatesService.name);
  private readonly cfg: FxConfig;

  constructor(
    @InjectRepository(FxRate)
    private readonly repo: Repository<FxRate>,
    @InjectRepository(Currency)
    private readonly currencies: Repository<Currency>,
    @Inject(RATES_PROVIDER)
    private readonly provider: IRatesProvider,
    config: ConfigService,
  ) {
    this.cfg = config.getOrThrow<FxConfig>('fx');
  }

  // ------------------------------------------------------------------ listing

  async findAll(query: QueryFxRateDto): Promise<PaginatedResult<FxRate>> {
    const { page = 1, limit = 50 } = query;
    const qb = this.repo
      .createQueryBuilder('f')
      .orderBy('f.asOfDate', 'DESC')
      .addOrderBy('f.quoteCurrencyCode', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.base) qb.andWhere('f.baseCurrencyCode = :base', { base: query.base });
    if (query.quote)
      qb.andWhere('f.quoteCurrencyCode = :quote', { quote: query.quote });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ------------------------------------------------------------------ fetching

  /** Daily automatic fetch (§2.2). Runs at 06:00 Dubai. */
  @Cron(CronExpression.EVERY_DAY_AT_6AM, { name: 'fx-daily-fetch' })
  async scheduledFetch(): Promise<void> {
    try {
      const r = await this.fetchDaily();
      this.logger.log(
        `Daily FX fetch: ${r.fetched} fetched, ${r.heldStale} held stale for ${r.asOfDate}`,
      );
    } catch (err) {
      this.logger.error(
        'Daily FX fetch failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /**
   * Fetch the day's rates from the provider for every active currency against
   * the base. Pairs the provider cannot price — or all pairs if the feed is
   * down — are held over from the previous day with `source = STALE_HELD`.
   * Existing manual overrides for the day are left untouched.
   */
  async fetchDaily(actorId?: string): Promise<FetchResult> {
    const base = this.cfg.baseCurrency;
    const asOfDate = this.today();
    const quotes = await this.quoteCurrencies(base);

    let provided: Map<string, string> = new Map();
    let feedAvailable = true;
    try {
      const result = await this.provider.fetchRates(base, quotes, asOfDate);
      provided = new Map(
        result.rates.map((r) => [r.quoteCurrencyCode.toUpperCase(), r.rate]),
      );
    } catch (err) {
      feedAvailable = false;
      this.logger.warn(
        `FX feed unavailable for ${asOfDate} — holding previous rates: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    let fetched = 0;
    let heldStale = 0;
    for (const quote of quotes) {
      // Never clobber an administrator's override for the day.
      const existing = await this.repo.findOne({
        where: { baseCurrencyCode: base, quoteCurrencyCode: quote, asOfDate },
      });
      if (existing?.source === 'MANUAL_OVERRIDE') continue;

      const rate = provided.get(quote);
      if (rate != null) {
        await this.upsertRate({
          existing,
          base,
          quote,
          asOfDate,
          rate,
          source: 'OANDA',
          providerName: this.provider.name,
          overrideReason: null,
          actorId,
        });
        fetched++;
      } else if (await this.holdStale(base, quote, asOfDate, existing, actorId)) {
        heldStale++;
      }
    }

    return {
      fetched,
      heldStale,
      asOfDate,
      providerName: feedAvailable ? this.provider.name : 'none (feed down)',
    };
  }

  // ----------------------------------------------------------------- override

  /** Manual override of the day's rate (§2.2); the reason is captured. */
  async override(dto: OverrideFxRateDto, actorId: string): Promise<FxRate> {
    const base = dto.baseCurrencyCode;
    const quote = dto.quoteCurrencyCode;
    const asOfDate = dto.asOfDate ?? this.today();
    const existing = await this.repo.findOne({
      where: { baseCurrencyCode: base, quoteCurrencyCode: quote, asOfDate },
    });
    return this.upsertRate({
      existing,
      base,
      quote,
      asOfDate,
      rate: dto.rate,
      source: 'MANUAL_OVERRIDE',
      providerName: null,
      overrideReason: dto.reason,
      actorId,
    });
  }

  // ----------------------------------------------------------- resolve/convert

  /**
   * Resolve the rate for `base → quote` as of a date, falling back to the most
   * recent earlier row and flagging staleness. Returns null when no rate has
   * ever been recorded for the pair.
   */
  async resolveRate(
    base: string,
    quote: string,
    asOfDate?: string,
  ): Promise<ResolvedFxRate | null> {
    const b = base.toUpperCase();
    const q = quote.toUpperCase();
    const target = asOfDate ?? this.today();
    if (b === q) {
      return {
        baseCurrencyCode: b,
        quoteCurrencyCode: q,
        rate: '1',
        asOfDate: target,
        effectiveAsOfDate: target,
        source: 'OANDA',
        isStale: false,
        lastUpdated: target,
        providerName: null,
        overrideReason: null,
      };
    }

    const row = await this.repo
      .createQueryBuilder('f')
      .where('f.baseCurrencyCode = :b', { b })
      .andWhere('f.quoteCurrencyCode = :q', { q })
      .andWhere('f.asOfDate <= :target', { target })
      .orderBy('f.asOfDate', 'DESC')
      .getOne();
    if (!row) return null;

    const isStale = row.source === 'STALE_HELD' || row.asOfDate < target;
    return {
      baseCurrencyCode: b,
      quoteCurrencyCode: q,
      rate: row.rate,
      asOfDate: target,
      effectiveAsOfDate: row.asOfDate,
      source: row.source,
      isStale,
      lastUpdated: row.fetchedAt.toISOString(),
      providerName: row.providerName ?? null,
      overrideReason: row.overrideReason ?? null,
    };
  }

  /**
   * Convert `amount` from one currency to another using recorded rates,
   * triangulating through the base currency (USD) and inverting where needed.
   * Returns null when the pair cannot be resolved. The result is indicative —
   * the final remittance rate is bank-determined (§2.6).
   */
  async convert(
    amount: number,
    from: string,
    to: string,
    asOfDate?: string,
  ): Promise<{ amount: number; rate: number; resolved: ResolvedFxRate } | null> {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    const target = asOfDate ?? this.today();

    // Direct, then inverse, then triangulate via the base currency.
    let resolved =
      (await this.resolveRate(f, t, target)) ??
      (await this.invertResolved(await this.resolveRate(t, f, target)));
    if (!resolved) resolved = await this.triangulate(f, t, target);
    if (!resolved) return null;

    const rate = Number(resolved.rate);
    return { amount: amount * rate, rate, resolved };
  }

  private async triangulate(
    from: string,
    to: string,
    target: string,
  ): Promise<ResolvedFxRate | null> {
    const base = this.cfg.baseCurrency;
    if (from === base || to === base) return null; // already tried directly
    // base→from and base→to ⇒ from→to = (base→to) / (base→from)
    const baseToFrom = await this.resolveRate(base, from, target);
    const baseToTo = await this.resolveRate(base, to, target);
    if (!baseToFrom || !baseToTo) return null;
    const rate = Number(baseToTo.rate) / Number(baseToFrom.rate);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return {
      baseCurrencyCode: from,
      quoteCurrencyCode: to,
      rate: String(rate),
      asOfDate: target,
      effectiveAsOfDate:
        baseToFrom.effectiveAsOfDate < baseToTo.effectiveAsOfDate
          ? baseToFrom.effectiveAsOfDate
          : baseToTo.effectiveAsOfDate,
      source:
        baseToFrom.source === 'STALE_HELD' || baseToTo.source === 'STALE_HELD'
          ? 'STALE_HELD'
          : 'OANDA',
      isStale: baseToFrom.isStale || baseToTo.isStale,
      lastUpdated:
        baseToFrom.lastUpdated < baseToTo.lastUpdated
          ? baseToFrom.lastUpdated
          : baseToTo.lastUpdated,
      providerName: baseToFrom.providerName ?? baseToTo.providerName,
      overrideReason: null,
    };
  }

  private invertResolved(r: ResolvedFxRate | null): ResolvedFxRate | null {
    if (!r) return null;
    const inv = 1 / Number(r.rate);
    if (!Number.isFinite(inv) || inv <= 0) return null;
    return {
      ...r,
      baseCurrencyCode: r.quoteCurrencyCode,
      quoteCurrencyCode: r.baseCurrencyCode,
      rate: String(inv),
    };
  }

  // ------------------------------------------------------------------- helpers

  async findOne(id: string): Promise<FxRate> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`FX rate ${id} not found`);
    return row;
  }

  private async quoteCurrencies(base: string): Promise<string[]> {
    const rows = await this.currencies.find({ where: { isActive: true } });
    return rows
      .map((c) => c.code?.toUpperCase())
      .filter(
        (code): code is string =>
          !!code && /^[A-Z]{3}$/.test(code) && code !== base,
      );
  }

  /**
   * Hold the previous day's rate forward for a pair the feed could not price.
   * Returns the held row, or null if there is no prior rate to carry over.
   */
  private async holdStale(
    base: string,
    quote: string,
    asOfDate: string,
    existing: FxRate | null,
    actorId?: string,
  ): Promise<FxRate | null> {
    const prior = await this.repo
      .createQueryBuilder('f')
      .where('f.baseCurrencyCode = :base', { base })
      .andWhere('f.quoteCurrencyCode = :quote', { quote })
      .andWhere('f.asOfDate < :asOfDate', { asOfDate })
      .orderBy('f.asOfDate', 'DESC')
      .getOne();
    if (!prior) return null;

    return this.upsertRate({
      existing,
      base,
      quote,
      asOfDate,
      rate: prior.rate,
      source: 'STALE_HELD',
      providerName: prior.providerName ?? null,
      overrideReason: null,
      actorId,
    });
  }

  private async upsertRate(args: {
    existing: FxRate | null;
    base: string;
    quote: string;
    asOfDate: string;
    rate: string;
    source: FxRateSource;
    providerName: string | null;
    overrideReason: string | null;
    actorId?: string;
  }): Promise<FxRate> {
    const row =
      args.existing ??
      this.repo.create({
        baseCurrencyCode: args.base,
        quoteCurrencyCode: args.quote,
        asOfDate: args.asOfDate,
        createdBy: args.actorId ?? null,
      });
    row.rate = args.rate;
    row.source = args.source;
    row.providerName = args.providerName;
    row.overrideReason = args.overrideReason;
    row.fetchedAt = new Date();
    row.updatedBy = args.actorId ?? null;
    return this.repo.save(row);
  }

  /** Current calendar day in the configured (Dubai) timezone, YYYY-MM-DD. */
  private today(): string {
    // The process clock is pinned to Asia/Dubai (see set-timezone.ts), so
    // en-CA local formatting yields the correct Dubai calendar date.
    return new Date().toLocaleDateString('en-CA');
  }
}
