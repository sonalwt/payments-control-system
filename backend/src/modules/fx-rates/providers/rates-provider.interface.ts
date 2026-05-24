/**
 * Abstraction over the external FX-rate feed (SOW §2.2).
 *
 * The rate source is abstracted behind this interface so that the provider
 * (default: OANDA Exchange Rates API) can be substituted without rework.
 */
export interface FetchedRate {
  quoteCurrencyCode: string; // e.g. "EUR", "INR"
  rate: string; // direct quote, base=1 -> quote
  asOfDate: string; // ISO date (YYYY-MM-DD)
}

export interface IRatesProvider {
  /** Stable provider id recorded against every persisted rate row. */
  readonly providerName: string;

  /**
   * Fetch quotes for the supplied currencies expressed against `baseCode`
   * for a given date (defaults to today).
   *
   * Implementations must throw on transport / API failure so the caller
   * can fall back to STALE_HELD logic.
   */
  fetchDailyRates(
    baseCode: string,
    quoteCodes: string[],
    asOfDate?: string,
  ): Promise<FetchedRate[]>;
}

export const RATES_PROVIDER = Symbol('RATES_PROVIDER');
