/**
 * Provenance of a stored FX rate (SOW §2.2).
 * - OANDA: fetched live from the rates provider for its as-of date.
 * - MANUAL_OVERRIDE: set by an authorised administrator; takes precedence.
 * - STALE_HELD: the feed was unavailable, so the previous day's rate is held
 *   forward for the current day and surfaced with a "stale rate" indicator.
 */
export enum FxRateSource {
  OANDA = 'OANDA',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
  STALE_HELD = 'STALE_HELD',
}
