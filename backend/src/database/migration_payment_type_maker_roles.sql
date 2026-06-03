-- =====================================================================
-- Payments Control System — Multi-select Maker roles for payment types.
--
-- A payment type may now have several maker roles: any user holding one
-- of them can create requests for that type. `maker_role_ids` is the new
-- source of truth; the existing single `maker_role_id` is retained as a
-- denormalised "primary" (kept in sync with the first entry) for legacy
-- single-role consumers.
--
-- Idempotent.
-- =====================================================================

ALTER TABLE payment_types
    ADD COLUMN IF NOT EXISTS maker_role_ids UUID[] NOT NULL DEFAULT '{}';

-- Backfill from the existing single maker role for rows not yet migrated.
UPDATE payment_types
   SET maker_role_ids = ARRAY[maker_role_id]
 WHERE maker_role_id IS NOT NULL
   AND (maker_role_ids IS NULL OR maker_role_ids = '{}');

-- GIN index supports `role_id = ANY(maker_role_ids)` / overlap lookups.
CREATE INDEX IF NOT EXISTS idx_payment_types_maker_role_ids
    ON payment_types USING GIN (maker_role_ids);
