-- =====================================================================
-- Payments Control System — Section 1.3 Counterparty Master
-- Unified vendor + customer master. Each row carries a role
-- (VENDOR / CUSTOMER / BOTH), country FK, tax identifiers (JSONB),
-- addresses (JSONB), and primary contact. Idempotent.
-- =====================================================================

CREATE TABLE IF NOT EXISTS counterparties (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                     VARCHAR(40)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    legal_name               VARCHAR(200),
    role                     VARCHAR(10)  NOT NULL,
    country_id               UUID REFERENCES countries(id) ON DELETE RESTRICT,
    country_code             CHAR(2),
    tax_identifiers          JSONB        NOT NULL DEFAULT '[]'::jsonb,
    addresses                JSONB        NOT NULL DEFAULT '[]'::jsonb,
    primary_contact_name     VARCHAR(150),
    primary_contact_email    VARCHAR(150),
    primary_contact_phone    VARCHAR(50),
    notes                    TEXT,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID,
    CONSTRAINT chk_counterparty_role CHECK (role IN ('VENDOR', 'CUSTOMER', 'BOTH'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_counterparties_code_live
    ON counterparties(code) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_counterparties_country_id
    ON counterparties(country_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_counterparties_role
    ON counterparties(role) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_counterparties_deleted_at
    ON counterparties(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE counterparties
    ADD COLUMN IF NOT EXISTS kyc_done BOOLEAN NOT NULL DEFAULT FALSE;
