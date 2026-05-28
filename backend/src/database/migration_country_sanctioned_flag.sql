-- =====================================================================
-- Payments Control System — Country master: sanctioned flag (SoW §1.6)
-- A simple boolean on the Country master used by §6.5 beneficiary
-- screening. Idempotent.
-- =====================================================================

ALTER TABLE countries
    ADD COLUMN IF NOT EXISTS is_sanctioned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_countries_is_sanctioned
    ON countries(is_sanctioned)
    WHERE deleted_at IS NULL AND is_sanctioned = TRUE;
