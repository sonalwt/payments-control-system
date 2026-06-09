-- =====================================================================
-- Payments Control System — Bank Account Charge Bands
--
-- Tiered bank charges per bank account, keyed by payment amount:
-- amounts in [min_amount, max_amount) incur `percentage`% in charges.
-- An open-ended band (max_amount IS NULL) covers everything at or above
-- min_amount. Bands are ordered by sort_order.
--
-- Idempotent.
-- =====================================================================

CREATE TABLE IF NOT EXISTS bank_account_charge_bands (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id   UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    sort_order        INT  NOT NULL,
    min_amount        DECIMAL(20,4) NOT NULL,
    max_amount        DECIMAL(20,4),
    percentage        DECIMAL(7,4)  NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_charge_band_amounts     CHECK (max_amount IS NULL OR max_amount > min_amount),
    CONSTRAINT chk_charge_band_percentage  CHECK (percentage >= 0 AND percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_charge_bands_bank_account ON bank_account_charge_bands(bank_account_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_charge_bands_account_sort ON bank_account_charge_bands(bank_account_id, sort_order);
