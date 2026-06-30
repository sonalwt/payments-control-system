import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FxRateSource } from './fx-rate-source.enum';

/**
 * One daily exchange rate of `1 base → quote`, keyed by as-of calendar day.
 * The base is always the group reporting currency (USD). At most one live row
 * exists per (base, quote, as-of date); a manual override or a held-stale row
 * replaces the provider row for that day.
 */
@Entity({ name: 'fx_rates' })
@Index(['baseCurrencyCode', 'quoteCurrencyCode', 'asOfDate'])
export class FxRate extends BaseEntity {
  @Column({ name: 'base_currency_code', type: 'char', length: 3 })
  baseCurrencyCode!: string;

  @Column({ name: 'quote_currency_code', type: 'char', length: 3 })
  quoteCurrencyCode!: string;

  /** Units of quote currency per 1 unit of base. Returned as a string. */
  @Column({ type: 'decimal', precision: 20, scale: 8 })
  rate!: string;

  /** Calendar day (Dubai) the rate applies to. */
  @Column({ name: 'as_of_date', type: 'date' })
  asOfDate!: string;

  @Column({ type: 'varchar', length: 20, default: FxRateSource.OANDA })
  source!: FxRateSource;

  /** Instant the rate was recorded — drives the "last updated" indicator. */
  @Column({ name: 'fetched_at', type: 'timestamptz' })
  fetchedAt!: Date;

  @Column({ name: 'provider_name', type: 'varchar', length: 60, nullable: true })
  providerName?: string | null;

  @Column({ name: 'override_reason', type: 'text', nullable: true })
  overrideReason?: string | null;
}
