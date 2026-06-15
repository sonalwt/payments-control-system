import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * Source of a recorded FX rate (§2.2):
 *  - OANDA           — fetched from the external rates provider.
 *  - MANUAL_OVERRIDE — set by an authorised administrator for the day.
 *  - STALE_HELD      — held over from a previous day because the feed was
 *                      unavailable; surfaced with a "stale rate" indicator.
 */
export type FxRateSource = 'OANDA' | 'MANUAL_OVERRIDE' | 'STALE_HELD';

export const FX_RATE_SOURCES: FxRateSource[] = [
  'OANDA',
  'MANUAL_OVERRIDE',
  'STALE_HELD',
];

/**
 * A single daily mid-rate of `base 1 → quote`, effective-dated by `asOfDate`.
 * Mirrors the `fx_rates` table. One row per (base, quote, as-of date).
 */
@Entity({ name: 'fx_rates' })
@Unique('uq_fx_rate_base_quote_asof', [
  'baseCurrencyCode',
  'quoteCurrencyCode',
  'asOfDate',
])
@Index('idx_fx_rates_quote_date', ['quoteCurrencyCode', 'asOfDate'])
@Index('idx_fx_rates_asof', ['asOfDate'])
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
