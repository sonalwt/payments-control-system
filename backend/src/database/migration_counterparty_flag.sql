-- =====================================================================
-- Payments Control System — Counterparty flag on banks + bank_accounts
-- The same tables back two distinct UIs:
--   • Masters menu → is_counterparty = FALSE (own / operating banks)
--   • Counterparty menu → is_counterparty = TRUE (counterparty banks)
-- SUPER_ADMIN sees both views. COUNTERPARTY role only sees the
-- counterparty view.
-- Idempotent — safe to re-run.
-- =====================================================================

ALTER TABLE banks
    ADD COLUMN IF NOT EXISTS is_counterparty BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE bank_accounts
    ADD COLUMN IF NOT EXISTS is_counterparty BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_banks_is_counterparty
    ON banks(is_counterparty) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_counterparty
    ON bank_accounts(is_counterparty) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- Replace legacy bank uniqueness with one that lets the same bank name
-- exist as both a master and a counterparty entry in the same country.
-- ---------------------------------------------------------------------
ALTER TABLE banks DROP CONSTRAINT IF EXISTS uq_banks_name_country;

CREATE UNIQUE INDEX IF NOT EXISTS uq_banks_name_country_kind_live
    ON banks(name, country_id, is_counterparty)
    WHERE deleted_at IS NULL;

-- bank_accounts uniqueness: switch from a hard UNIQUE constraint to a
-- partial unique on live rows + scoped by the bank FK. Master and
-- counterparty already differ by bank_id, so the flag isn't needed here.
ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS uq_bank_account_number;
DROP INDEX IF EXISTS uq_bank_accounts_number_per_bankname_live;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_accounts_bank_account_live
    ON bank_accounts(bank_id, account_number)
    WHERE deleted_at IS NULL AND bank_id IS NOT NULL;
