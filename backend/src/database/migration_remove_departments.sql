-- =====================================================================
-- Payments Control System — Remove Department master
-- Drops the user_departments link table, drops the FK + NOT NULL column
-- employees.department_id, then drops the departments table itself.
-- Idempotent.
-- =====================================================================

BEGIN;

-- 1) Drop the link table (no rows of value)
DROP TABLE IF EXISTS user_departments CASCADE;

-- 2) Drop FK + supporting index + column on employees
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_department_id_fkey;
DROP INDEX IF EXISTS idx_employees_department_id;
ALTER TABLE employees DROP COLUMN IF EXISTS department_id;

-- 3) Drop departments table itself
DROP TABLE IF EXISTS departments CASCADE;

COMMIT;
