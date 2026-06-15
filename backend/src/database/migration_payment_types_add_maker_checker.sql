-- =====================================================================
-- Payments Control System — Payment Type: default Maker + Checker roles
-- Adds nullable maker_role_id / checker_role_id FKs to payment_types so
-- a default Maker and Checker role can be configured per payment type.
-- Idempotent.
-- =====================================================================

ALTER TABLE payment_types
    ADD COLUMN IF NOT EXISTS maker_role_id UUID
    REFERENCES roles(id) ON DELETE RESTRICT;

ALTER TABLE payment_types
    ADD COLUMN IF NOT EXISTS checker_role_id UUID
    REFERENCES roles(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_payment_types_maker_role_id
    ON payment_types(maker_role_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payment_types_checker_role_id
    ON payment_types(checker_role_id) WHERE deleted_at IS NULL;
