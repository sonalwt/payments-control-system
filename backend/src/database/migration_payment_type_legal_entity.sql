-- =====================================================================
-- Payments Control System — Move "legal entity" from payment request
-- to payment type.
--
-- The legal entity is now a (required) property of the payment type:
-- each type belongs to exactly one legal entity. A request's legal
-- entity is derived from its payment type.
--
--   • payment_types    : ADD legal_entity_id FK (NOT NULL) + index
--   • payment_requests : DROP legal_entity_id (and its index)
--
-- Idempotent.
-- =====================================================================

-- 1. Add legal_entity_id to payment_types (added nullable first so
--    existing rows can be backfilled before the NOT NULL is enforced).
ALTER TABLE payment_types
    ADD COLUMN IF NOT EXISTS legal_entity_id UUID
    REFERENCES legal_entities(id) ON DELETE RESTRICT;

-- Backfill any existing rows (e.g. the seeded system payment types) with
-- the oldest legal entity so the NOT NULL constraint can be applied.
UPDATE payment_types
   SET legal_entity_id = (
       SELECT id FROM legal_entities ORDER BY created_at, id LIMIT 1
   )
 WHERE legal_entity_id IS NULL;

-- Enforce NOT NULL only once every row is populated. If no legal entities
-- exist yet (fresh DB with seeded types but no entities), this is skipped
-- and re-running the migration after seeding entities will enforce it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM payment_types WHERE legal_entity_id IS NULL) THEN
        ALTER TABLE payment_types ALTER COLUMN legal_entity_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_types_legal_entity_id
    ON payment_types(legal_entity_id) WHERE deleted_at IS NULL;

-- 2. Drop legal_entity_id from payment_requests — a request's legal
--    entity now comes from its payment type.
DROP INDEX IF EXISTS idx_payment_requests_entity;

ALTER TABLE payment_requests
    DROP COLUMN IF EXISTS legal_entity_id;
