-- =====================================================================
-- Payments Control System — Department Master
-- Simplify departments to a basic master: code, name, status. Drop the
-- business_unit_id NOT NULL so SUPER_ADMIN can manage entries directly,
-- and switch uniqueness from (business_unit_id, code|name) to a global
-- code uniqueness on live rows.
-- Idempotent — safe to re-run on any prior state.
-- =====================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='departments' AND column_name='business_unit_id' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE departments ALTER COLUMN business_unit_id DROP NOT NULL';
    END IF;
END $$;

ALTER TABLE departments
    DROP CONSTRAINT IF EXISTS uq_dept_name_per_bu,
    DROP CONSTRAINT IF EXISTS uq_dept_code_per_bu;

CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_code_live
    ON departments(code)
    WHERE deleted_at IS NULL;
