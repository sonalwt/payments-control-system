import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';
import { IsNull, Not, Repository } from 'typeorm';
import { FxRate } from './fx-rate.entity';
import { FxRateSource } from './fx-rate-source.enum';
import { FxRateQueryDto } from './dto/fx-rate-query.dto';
import { OverrideFxRateDto } from './dto/override-fx-rate.dto';
import {
  FX_RATE_PROVIDER,
  FxRateProvider,
} from './providers/fx-rate-provider.interface';
import { Currency } from '../currencies/currency.entity';
import { FxConfig } from '../../config/fx.config';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { DUBAI_TZ, dubaiToday } from '../../common/utils/datetime';

export interface FetchSummary {
  fetched: number;
  heldStale: number;
  asOfDate: string;
  providerName: string;
}

/** The rate the system should use for a base→quote conversion, with staleness. */
export interface ResolvedFxRate {
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

@Injectable()
export class FxRatesService implements OnModuleInit {
  private readonly logger = new Logger(FxRatesService.name);
  private static readonly CRON_NAME = 'fx-daily-fetch';

  constructor(
    @InjectRepository(FxRate)
    private readonly repo: Repository<FxRate>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
    @Inject(FX_RATE_PROVIDER)
    private readonly provider: FxRateProvider,
    private readonly config: ConfigService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  private get fx(): FxConfig {
    return this.config.getOrThrow<FxConfig>('fx');
  }

  private get base(): string {
    return this.fx.reportingCurrency;
  }

  /** Register the daily auto-fetch cron from config (§2.2). */
  onModuleInit(): void {
    const fx = this.fx;
    if (!fx.scheduleEnabled) {
      this.logger.log('FX daily fetch schedule disabled (FX_SCHEDULE_ENABLED=false).');
      return;
    }
    const job = new CronJob(
      fx.fetchCron,
      () => {
        void this.fetchDaily().catch((err) =>
          this.logger.error(
            `Scheduled FX fetch failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      },
      null,
      true,
      DUBAI_TZ,
    );
    this.scheduler.addCronJob(FxRatesService.CRON_NAME, job as unknown as CronJob);
    this.logger.log(`FX daily fetch scheduled (${fx.fetchCron} ${DUBAI_TZ}).`);
  }

  // ------------------------------------------------------------------ reads

  async findAll(query: FxRateQueryDto): Promise<PaginatedResult<FxRate>> {
    const { page = 1, limit = 50, quote } = query;
    const qb = this.repo
      .createQueryBuilder('r')
      .orderBy('r.asOfDate', 'DESC')
      .addOrderBy('r.quoteCurrencyCode', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (quote) {
      qb.andWhere('r.quoteCurrencyCode = :quote', { quote });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Resolve the rate to apply for `base → quote` on `onDate` (default today).
   * Used by USD-equivalent displays and the §2.6 cross-currency check. Falls
   * back to the most recent prior rate, flagged stale, when the day is missing.
   */
  async resolve(
    quoteCurrencyCode: string,
    onDate?: string,
  ): Promise<ResolvedFxRate> {
    const quote = quoteCurrencyCode.toUpperCase();
    const asOfDate = onDate ?? dubaiToday();
    if (quote === this.base) {
      return {
        baseCurrencyCode: this.base,
        quoteCurrencyCode: quote,
        rate: '1',
        asOfDate,
        effectiveAsOfDate: asOfDate,
        source: FxRateSource.OANDA,
        isStale: false,
        lastUpdated: new Date(),
        providerName: this.provider.name,
        overrideReason: null,
      };
    }

    const row = await this.repo
      .createQueryBuilder('r')
      .where('r.baseCurrencyCode = :base', { base: this.base })
      .andWhere('r.quoteCurrencyCode = :quote', { quote })
      .andWhere('r.asOfDate <= :asOfDate', { asOfDate })
      .orderBy('r.asOfDate', 'DESC')
      .getOne();

    if (!row) {
      throw new NotFoundException(
        `No FX rate available for ${this.base}/${quote} on or before ${asOfDate}.`,
      );
    }

    const isStale =
      row.source === FxRateSource.STALE_HELD || row.asOfDate !== asOfDate;
    return {
      baseCurrencyCode: this.base,
      quoteCurrencyCode: quote,
      rate: row.rate,
      asOfDate,
      effectiveAsOfDate: row.asOfDate,
      source: row.source,
      isStale,
      lastUpdated: row.fetchedAt,
      providerName: row.providerName ?? null,
      overrideReason: row.overrideReason ?? null,
    };
  }

  // ----------------------------------------------------------------- writes

  /**
   * Fetch today's rates from the provider for every active quote currency.
   * Quotes the feed cannot supply hold the previous day's rate, marked stale.
   * Existing manual overrides for the day are preserved.
   */
  async fetchDaily(actorId?: string): Promise<FetchSummary> {
    const asOfDate = dubaiToday();
    const quotes = await this.activeQuoteCodes();

    let providerRates: Map<string, string>;
    try {
      const rows = await this.provider.fetchRates(this.base, quotes, asOfDate);
      providerRates = new Map(rows.map((r) => [r.quoteCurrencyCode, r.rate]));
    } catch (err) {
      this.logger.warn(
        `FX provider unavailable for ${asOfDate}; holding previous rates. ` +
          (err instanceof Error ? err.message : String(err)),
      );
      providerRates = new Map();
    }

    let fetched = 0;
    let heldStale = 0;
    for (const quote of quotes) {
      const existing = await this.liveRow(quote, asOfDate);
      // Never clobber an administrator's override for the day.
      if (existing?.source === FxRateSource.MANUAL_OVERRIDE) continue;

      const live = providerRates.get(quote);
      if (live != null) {
        await this.upsert(quote, asOfDate, live, {
          source: FxRateSource.OANDA,
          providerName: this.provider.name,
          actorId,
          existing,
        });
        fetched++;
        continue;
      }

      // Feed missing this quote — hold the previous day's rate forward.
      const prior = await this.priorRow(quote, asOfDate);
      if (prior) {
        await this.upsert(quote, asOfDate, prior.rate, {
          source: FxRateSource.STALE_HELD,
          providerName: prior.providerName ?? this.provider.name,
          actorId,
          existing,
        });
        heldStale++;
      }
    }

    this.logger.log(
      `FX fetch ${asOfDate}: ${fetched} fetched, ${heldStale} held stale (base ${this.base}).`,
    );
    return { fetched, heldStale, asOfDate, providerName: this.provider.name };
  }

  /** Administrator manual override for a day (§2.2). Audited at the HTTP layer. */
  async override(dto: OverrideFxRateDto, actorId: string): Promise<FxRate> {
    const base = dto.baseCurrencyCode ?? this.base;
    const quote = dto.quoteCurrencyCode;
    if (base === quote) {
      throw new BadRequestException('Base and quote currencies must differ.');
    }
    const asOfDate = dto.asOfDate ?? dubaiToday();
    const existing = await this.repo.findOne({
      where: {
        baseCurrencyCode: base,
        quoteCurrencyCode: quote,
        asOfDate,
      },
    });
    return this.upsert(quote, asOfDate, String(dto.rate), {
      base,
      source: FxRateSource.MANUAL_OVERRIDE,
      overrideReason: dto.reason,
      providerName: null,
      actorId,
      existing,
    });
  }

  // ---------------------------------------------------------------- helpers

  private async activeQuoteCodes(): Promise<string[]> {
    const currencies = await this.currencyRepo.find({
      where: { isActive: true, code: Not(IsNull()) },
    });
    const codes = new Set<string>();
    for (const c of currencies) {
      const code = c.code?.toUpperCase();
      if (code && code !== this.base) codes.add(code);
    }
    return [...codes].sort();
  }

  private liveRow(quote: string, asOfDate: string): Promise<FxRate | null> {
    return this.repo.findOne({
      where: {
        baseCurrencyCode: this.base,
        quoteCurrencyCode: quote,
        asOfDate,
      },
    });
  }

  private priorRow(quote: string, beforeDate: string): Promise<FxRate | null> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.baseCurrencyCode = :base', { base: this.base })
      .andWhere('r.quoteCurrencyCode = :quote', { quote })
      .andWhere('r.asOfDate < :beforeDate', { beforeDate })
      .orderBy('r.asOfDate', 'DESC')
      .getOne();
  }

  private async upsert(
    quote: string,
    asOfDate: string,
    rate: string,
    opts: {
      base?: string;
      source: FxRateSource;
      providerName: string | null;
      overrideReason?: string | null;
      actorId?: string;
      existing?: FxRate | null;
    },
  ): Promise<FxRate> {
    const base = opts.base ?? this.base;
    const row =
      opts.existing ??
      (await this.liveRow(quote, asOfDate)) ??
      this.repo.create({
        baseCurrencyCode: base,
        quoteCurrencyCode: quote,
        asOfDate,
        createdBy: opts.actorId ?? null,
      });

    row.baseCurrencyCode = base;
    row.rate = rate;
    row.source = opts.source;
    row.providerName = opts.providerName;
    row.overrideReason = opts.overrideReason ?? null;
    row.fetchedAt = new Date();
    row.updatedBy = opts.actorId ?? row.updatedBy ?? null;
    return this.repo.save(row);
  }
}
