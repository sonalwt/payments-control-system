-- =====================================================================
-- Payments Control System — Remove Business Unit master
-- Drops the departments.business_unit_id column (and its FK + index)
-- then drops the business_units table itself.
-- Idempotent.
-- =====================================================================

BEGIN;

-- 1) Drop FK + supporting index + column on departments
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_business_unit_id_fkey;
DROP INDEX IF EXISTS idx_departments_business_unit_id;
ALTER TABLE departments DROP COLUMN IF EXISTS business_unit_id;

-- 2) Drop the business_units table
DROP TABLE IF EXISTS business_units CASCADE;

COMMIT;
