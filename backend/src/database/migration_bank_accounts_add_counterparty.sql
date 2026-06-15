-- =====================================================================
-- Payments Control System - Counterparty bank accounts
-- Add bank_accounts.counterparty_id FK so counterparty-owned accounts
-- record which counterparty they belong to. Nullable: legacy "own" bank
-- accounts (is_counterparty = FALSE) leave this NULL.
-- Idempotent.
-- =====================================================================

ALTER TABLE bank_accounts
    ADD COLUMN IF NOT EXISTS counterparty_id UUID
    REFERENCES counterparties(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_counterparty_id
    ON bank_accounts(counterparty_id) WHERE counterparty_id IS NOT NULL AND deleted_at IS NULL;
