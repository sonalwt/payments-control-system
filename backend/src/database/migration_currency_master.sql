-- =====================================================================
-- Payments Control System — Currency Master
-- Simplify the currencies table for a SUPER_ADMIN master with just
-- (name, status). Add audit / soft-delete columns to match BaseEntity,
-- and relax the legacy ISO 4217 `code` column so it is no longer
-- required (kept readable for seeded rows + downstream consumers).
-- Idempotent — safe to re-run on any prior state.
-- =====================================================================

ALTER TABLE currencies
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID;

CREATE INDEX IF NOT EXISTS idx_currencies_deleted_at
    ON currencies(deleted_at)
    WHERE deleted_at IS NULL;

-- Relax `code` — no longer captured in the simplified master form.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='currencies' AND column_name='code' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE currencies ALTER COLUMN code DROP NOT NULL';
    END IF;
END $$;

-- Drop the legacy global UNIQUE constraint on `code` so we can replace it
-- with a partial unique index that allows NULLs + soft-deleted rows.
ALTER TABLE currencies
    DROP CONSTRAINT IF EXISTS currencies_code_key,
    DROP CONSTRAINT IF EXISTS uq_currencies_code;

CREATE UNIQUE INDEX IF NOT EXISTS uq_currencies_code_live
    ON currencies(code)
    WHERE code IS NOT NULL AND deleted_at IS NULL;
