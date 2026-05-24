import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { FxRate } from './fx-rate.entity';

@Injectable()
export class FxRatesRepository {
  constructor(
    @InjectRepository(FxRate) private readonly repo: Repository<FxRate>,
  ) {}

  get raw(): Repository<FxRate> {
    return this.repo;
  }

  create(data: Partial<FxRate>): FxRate {
    return this.repo.create(data);
  }

  save(entity: FxRate): Promise<FxRate> {
    return this.repo.save(entity);
  }

  /** Exact match for (base, quote, asOfDate). */
  findExact(
    baseCode: string,
    quoteCode: string,
    asOfDate: string,
  ): Promise<FxRate | null> {
    return this.repo.findOne({
      where: {
        baseCurrencyCode: baseCode.toUpperCase(),
        quoteCurrencyCode: quoteCode.toUpperCase(),
        asOfDate,
      },
    });
  }

  /** Latest row on/before asOfDate (used by the stale-rate fallback). */
  findLatestOnOrBefore(
    baseCode: string,
    quoteCode: string,
    asOfDate: string,
  ): Promise<FxRate | null> {
    return this.repo.findOne({
      where: {
        baseCurrencyCode: baseCode.toUpperCase(),
        quoteCurrencyCode: quoteCode.toUpperCase(),
        asOfDate: LessThanOrEqual(asOfDate),
      },
      order: { asOfDate: 'DESC' },
    });
  }
}
