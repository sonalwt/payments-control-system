-- =====================================================================
-- Payments Control System — Payment Category Master
-- Simple master: category name + status. Super Admin only.
-- Idempotent.
-- =====================================================================

CREATE TABLE IF NOT EXISTS payment_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    created_by  UUID,
    updated_by  UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_categories_name_live
    ON payment_categories(name) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payment_categories_deleted_at
    ON payment_categories(deleted_at) WHERE deleted_at IS NULL;
