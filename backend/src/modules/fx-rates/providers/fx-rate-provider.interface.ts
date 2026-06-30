/**
 * Abstraction over an external FX rates source (SOW §2.2). OANDA is the
 * default implementation; binding the interface to a DI token lets the
 * provider be substituted without touching the service that consumes it.
 */
export const FX_RATE_PROVIDER = Symbol('FX_RATE_PROVIDER');

export interface ProviderRate {
  quoteCurrencyCode: string;
  /** Units of quote currency per 1 unit of base. */
  rate: string;
}

export interface FxRateProvider {
  /** Human-readable provider name, recorded against each fetched rate. */
  readonly name: string;

  /**
   * Fetch `base → quote` rates for the given as-of day. Implementations return
   * only the quotes they could resolve; a missing quote is held stale by the
   * caller. Throwing signals a total feed outage (also handled by holding).
   */
  fetchRates(
    baseCurrencyCode: string,
    quoteCurrencyCodes: string[],
    asOfDate: string,
  ): Promise<ProviderRate[]>;
}
