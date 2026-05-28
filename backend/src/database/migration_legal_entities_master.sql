-- =====================================================================
-- Payments Control System — Legal Entity Master
-- Simplify legal_entities to a basic master: name, code, status only.
-- Org-hierarchy FKs (group_id, base_currency_id) and supporting fields
-- become optional so SUPER_ADMIN can manage entries without picking a
-- group or currency.
-- Idempotent — safe to re-run on any prior state.
-- =====================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='legal_entities' AND column_name='group_id') THEN
        EXECUTE 'ALTER TABLE legal_entities ALTER COLUMN group_id DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='legal_entities' AND column_name='base_currency_id') THEN
        EXECUTE 'ALTER TABLE legal_entities ALTER COLUMN base_currency_id DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='legal_entities' AND column_name='registered_country') THEN
        EXECUTE 'ALTER TABLE legal_entities ALTER COLUMN registered_country DROP NOT NULL';
    END IF;
END $$;

ALTER TABLE legal_entities
    DROP CONSTRAINT IF EXISTS uq_legal_entity_name_per_group,
    DROP CONSTRAINT IF EXISTS uq_legal_entity_code_per_group;

CREATE UNIQUE INDEX IF NOT EXISTS uq_legal_entities_code
    ON legal_entities(code)
    WHERE deleted_at IS NULL;
