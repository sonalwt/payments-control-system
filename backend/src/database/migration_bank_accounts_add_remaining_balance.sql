-- =====================================================================
-- Payments Control System — Bank Accounts: remaining balance field
-- Adds a stored remaining_balance column (mirrors opening_balance /
-- minimum_balance in shape).
-- Idempotent.
-- =====================================================================

ALTER TABLE bank_accounts
    ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(20,4) NOT NULL DEFAULT 0;
