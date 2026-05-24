import { Check, Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * SOW §2.2 — Foreign Exchange Rates.
 *
 * One row per (base, quote, asOfDate). USD is the group reporting currency
 * and the default base. Rate is stored as DECIMAL(20,10) — direct quote
 * (1 unit of base = `rate` units of quote).
 *
 * `source` records provenance: OANDA when fetched from the external feed,
 * MANUAL_OVERRIDE when an admin override applies for the day, STALE_HELD
 * when the feed was unavailable and the previous day's rate is carried
 * forward (the read API reports `isStale: true` for these and any read
 * older than the requested as-of date).
 */
export type FxRateSource = 'OANDA' | 'MANUAL_OVERRIDE' | 'STALE_HELD';

@Entity({ name: 'fx_rates' })
@Unique('uq_fx_rate_base_quote_asof', ['baseCurrencyCode', 'quoteCurrencyCode', 'asOfDate'])
@Index('idx_fx_rates_quote_date', ['quoteCurrencyCode', 'asOfDate'])
@Index('idx_fx_rates_asof', ['asOfDate'])
@Check('chk_fx_rate_positive', 'rate > 0')
@Check('chk_fx_rate_source', `source IN ('OANDA','MANUAL_OVERRIDE','STALE_HELD')`)
export class FxRate extends BaseEntity {
  @Column({ name: 'base_currency_code', type: 'char', length: 3 })
  baseCurrencyCode!: string;

  @Column({ name: 'quote_currency_code', type: 'char', length: 3 })
  quoteCurrencyCode!: string;

  @Column({ type: 'decimal', precision: 20, scale: 10 })
  rate!: string;

  @Column({ name: 'as_of_date', type: 'date' })
  asOfDate!: string;

  @Column({ type: 'varchar', length: 20 })
  source!: FxRateSource;

  @Column({ name: 'fetched_at', type: 'timestamptz', default: () => 'now()' })
  fetchedAt!: Date;

  @Column({ name: 'provider_name', type: 'varchar', length: 50, nullable: true })
  providerName?: string | null;

  @Column({ name: 'override_reason', type: 'text', nullable: true })
  overrideReason?: string | null;
}
