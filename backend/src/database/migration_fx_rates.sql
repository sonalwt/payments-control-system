-- =====================================================================
-- Payments Control System — Foreign Exchange Rates (SOW §2.2)
-- Stores daily `1 base -> quote` rates (base = group reporting currency,
-- USD). Rows are sourced from OANDA, a manual administrator override, or
-- held forward from the previous day (stale). One live row per
-- (base, quote, as-of date); supports the §2.6 cross-currency check and
-- USD-equivalent dashboard displays.
-- Idempotent — safe to re-run on any prior state.
-- =====================================================================

CREATE TABLE IF NOT EXISTS fx_rates (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency_code   CHAR(3)       NOT NULL,
    quote_currency_code  CHAR(3)       NOT NULL,
    rate                 NUMERIC(20,8) NOT NULL,
    as_of_date           DATE          NOT NULL,
    source               VARCHAR(20)   NOT NULL DEFAULT 'OANDA',
    fetched_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    provider_name        VARCHAR(60),
    override_reason      TEXT,
    -- BaseEntity audit / soft-delete columns
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ,
    created_by           UUID,
    updated_by           UUID
);

-- Lookup index for resolve()/findAll() (base + quote + most-recent date).
CREATE INDEX IF NOT EXISTS idx_fx_rates_base_quote_date
    ON fx_rates (base_currency_code, quote_currency_code, as_of_date DESC);

-- At most one live rate per base/quote/day.
CREATE UNIQUE INDEX IF NOT EXISTS uq_fx_rates_base_quote_date_live
    ON fx_rates (base_currency_code, quote_currency_code, as_of_date)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fx_rates_deleted_at
    ON fx_rates (deleted_at)
    WHERE deleted_at IS NULL;
