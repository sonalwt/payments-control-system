-- =====================================================================
-- Payments Control System — Business Unit master + downstream FKs
--   • New business_units table (name, status)
--   • departments.business_unit_id  (FK)
--   • legal_entities.country_id     (FK to countries master)
-- DB columns are nullable so legacy rows stay valid. New entries are
-- required by the API DTOs.
-- Idempotent.
-- =====================================================================

CREATE TABLE IF NOT EXISTS business_units (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    created_by  UUID,
    updated_by  UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_business_units_name_live
    ON business_units(name) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_units_deleted_at
    ON business_units(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS business_unit_id UUID REFERENCES business_units(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_departments_business_unit_id
    ON departments(business_unit_id) WHERE deleted_at IS NULL;

ALTER TABLE legal_entities
    ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_legal_entities_country_id
    ON legal_entities(country_id) WHERE deleted_at IS NULL;

-- Each business unit belongs to a legal entity so the Department form can
-- cascade the BU dropdown off the selected legal entity.
ALTER TABLE business_units
    ADD COLUMN IF NOT EXISTS legal_entity_id UUID REFERENCES legal_entities(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_business_units_legal_entity_id
    ON business_units(legal_entity_id) WHERE deleted_at IS NULL;
