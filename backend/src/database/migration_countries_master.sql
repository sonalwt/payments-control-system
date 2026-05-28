-- =====================================================================
-- Payments Control System — Country Master
-- Simplify countries to a basic master: name, short_name, code, currency,
-- status. Add short_name + currency_id; drop legal_entity_id NOT NULL so
-- SUPER_ADMIN can manage entries directly without binding to a legal
-- entity. Switch uniqueness from (legal_entity_id, iso_code) to a global
-- iso_code uniqueness on live (non-soft-deleted) rows.
-- Idempotent — safe to re-run on any prior state.
-- =====================================================================

ALTER TABLE countries
    ADD COLUMN IF NOT EXISTS short_name  VARCHAR(60),
    ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES currencies(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='countries' AND column_name='legal_entity_id') THEN
        EXECUTE 'ALTER TABLE countries ALTER COLUMN legal_entity_id DROP NOT NULL';
    END IF;
END $$;

ALTER TABLE countries
    DROP CONSTRAINT IF EXISTS uq_country_per_legal_entity;

CREATE UNIQUE INDEX IF NOT EXISTS uq_countries_iso_code
    ON countries(iso_code)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_countries_currency_id
    ON countries(currency_id);
