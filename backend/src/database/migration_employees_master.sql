-- =====================================================================
-- Payments Control System — Employee Master
-- Extend employees in place with master fields requested by the
-- SUPER_ADMIN: country (FK), department (FK), mobile_number, address.
-- Relax legacy NOT NULLs that the new master form doesn't collect.
-- Idempotent — safe to re-run on any prior state.
-- =====================================================================

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS country_id     UUID REFERENCES countries(id)   ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS department_id  UUID REFERENCES departments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS mobile_number  VARCHAR(30),
    ADD COLUMN IF NOT EXISTS address        TEXT;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='employees' AND column_name='legal_entity_id' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE employees ALTER COLUMN legal_entity_id DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='employees' AND column_name='country_code' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE employees ALTER COLUMN country_code DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='employees' AND column_name='base_currency_id' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE employees ALTER COLUMN base_currency_id DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='employees' AND column_name='payroll_category' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE employees ALTER COLUMN payroll_category DROP NOT NULL';
    END IF;
END $$;

ALTER TABLE employees
    DROP CONSTRAINT IF EXISTS uq_employee_code_per_entity;

CREATE UNIQUE INDEX IF NOT EXISTS uq_employees_employee_code_live
    ON employees(employee_code)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employees_country_id    ON employees(country_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id) WHERE deleted_at IS NULL;
