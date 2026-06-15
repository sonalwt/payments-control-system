/**
 * Abstraction over the external FX rates feed (§2.2). The default provider is
 * OANDA; any substitute (another vendor, a manual feed, a stub for tests) only
 * needs to implement {@link IRatesProvider} and be bound to {@link RATES_PROVIDER}
 * — no other module changes are required.
 */

export interface ProviderRate {
  /** ISO 4217 alpha-3 quote currency, upper-case. */
  quoteCurrencyCode: string;
  /** Mid-rate of `base 1 → quote`, as a decimal string. */
  rate: string;
}

export interface RatesProviderResult {
  baseCurrencyCode: string;
  /** Effective date of the quotes, YYYY-MM-DD. */
  asOfDate: string;
  rates: ProviderRate[];
}

export interface IRatesProvider {
  /** Human-readable provider name, persisted on each fetched rate. */
  readonly name: string;

  /**
   * Fetch the day's mid-rates for `base → each quote`. Implementations should
   * throw when the feed is unavailable; the service treats that as "hold the
   * previous day's rate" (§2.2). Quotes the provider cannot price are simply
   * omitted from the result and are likewise held stale.
   */
  fetchRates(
    baseCurrencyCode: string,
    quoteCurrencyCodes: string[],
    asOfDate: string,
  ): Promise<RatesProviderResult>;
}

/** DI token for the bound {@link IRatesProvider}. */
export const RATES_PROVIDER = Symbol('RATES_PROVIDER');
