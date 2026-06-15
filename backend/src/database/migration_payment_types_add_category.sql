-- =====================================================================
-- Payments Control System — Link Payment Types to Payment Categories
-- Adds nullable payment_category_id FK to payment_types.
-- Idempotent.
-- =====================================================================

ALTER TABLE payment_types
    ADD COLUMN IF NOT EXISTS payment_category_id UUID
    REFERENCES payment_categories(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_payment_types_category_id
    ON payment_types(payment_category_id) WHERE deleted_at IS NULL;
