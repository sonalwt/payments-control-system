-- =====================================================================
-- Payments Control System — Section 1.1
-- PostgreSQL schema for Entities & Organisational Structure
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive text

-- ---------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------

CREATE TABLE currencies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        CHAR(3) NOT NULL UNIQUE,         -- ISO 4217
    name        VARCHAR(80) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Hierarchy: Group → Legal Entity → Country → Business Unit → Department
-- ---------------------------------------------------------------------

CREATE TABLE groups (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(150) NOT NULL,
    code         VARCHAR(30)  NOT NULL UNIQUE,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,
    created_by   UUID,
    updated_by   UUID,
    CONSTRAINT uq_group_name UNIQUE (name)
);
CREATE INDEX idx_groups_deleted_at ON groups(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE legal_entities (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id                 UUID NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
    name                     VARCHAR(200) NOT NULL,
    code                     VARCHAR(30)  NOT NULL,
    registered_country       CHAR(2)      NOT NULL,    -- ISO 3166-1 alpha-2
    base_currency_id         UUID         NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    approval_matrix_ref      UUID,                     -- forward reference, populated when matrices exist
    tax_identifier           VARCHAR(50),
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID,
    CONSTRAINT uq_legal_entity_name_per_group UNIQUE (group_id, name),
    CONSTRAINT uq_legal_entity_code_per_group UNIQUE (group_id, code)
);
CREATE INDEX idx_legal_entities_group_id     ON legal_entities(group_id);
CREATE INDEX idx_legal_entities_currency     ON legal_entities(base_currency_id);
CREATE INDEX idx_legal_entities_deleted_at   ON legal_entities(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE countries (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_entity_id   UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    name              VARCHAR(120) NOT NULL,
    iso_code          CHAR(2)      NOT NULL,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ,
    created_by        UUID,
    updated_by        UUID,
    CONSTRAINT uq_country_per_legal_entity UNIQUE (legal_entity_id, iso_code)
);
CREATE INDEX idx_countries_legal_entity_id ON countries(legal_entity_id);
CREATE INDEX idx_countries_deleted_at      ON countries(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE business_units (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id   UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    name         VARCHAR(150) NOT NULL,
    code         VARCHAR(30)  NOT NULL,
    description  TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,
    created_by   UUID,
    updated_by   UUID,
    CONSTRAINT uq_bu_name_per_country UNIQUE (country_id, name),
    CONSTRAINT uq_bu_code_per_country UNIQUE (country_id, code)
);
CREATE INDEX idx_business_units_country_id ON business_units(country_id);
CREATE INDEX idx_business_units_deleted_at ON business_units(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE departments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id  UUID NOT NULL REFERENCES business_units(id) ON DELETE RESTRICT,
    name              VARCHAR(150) NOT NULL,
    code              VARCHAR(30)  NOT NULL,
    description       TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ,
    created_by        UUID,
    updated_by        UUID,
    CONSTRAINT uq_dept_name_per_bu UNIQUE (business_unit_id, name),
    CONSTRAINT uq_dept_code_per_bu UNIQUE (business_unit_id, code)
);
CREATE INDEX idx_departments_business_unit_id ON departments(business_unit_id);
CREATE INDEX idx_departments_deleted_at       ON departments(deleted_at) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- Identity & access
-- ---------------------------------------------------------------------

CREATE TABLE users (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email              CITEXT NOT NULL UNIQUE,
    password_hash      VARCHAR(255) NOT NULL,
    full_name          VARCHAR(150) NOT NULL,
    employee_code      VARCHAR(50)  UNIQUE,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    is_platform_admin  BOOLEAN NOT NULL DEFAULT FALSE,   -- grants SUPER_ADMIN globally (bootstrap)
    last_login_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID
);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE roles (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(50)  NOT NULL UNIQUE,    -- SUPER_ADMIN, APPROVER, ...
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    is_system    BOOLEAN NOT NULL DEFAULT FALSE,  -- system roles cannot be deleted
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);

-- A user holds (role × legal entity). Different roles in different entities.
CREATE TABLE user_entity_roles (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
    legal_entity_id  UUID NOT NULL REFERENCES legal_entities(id) ON DELETE CASCADE,
    role_id          UUID NOT NULL REFERENCES roles(id)          ON DELETE RESTRICT,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from   DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to     DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       UUID,
    updated_by       UUID,
    CONSTRAINT uq_user_entity_role UNIQUE (user_id, legal_entity_id, role_id)
);
CREATE INDEX idx_uer_user           ON user_entity_roles(user_id);
CREATE INDEX idx_uer_legal_entity   ON user_entity_roles(legal_entity_id);
CREATE INDEX idx_uer_role           ON user_entity_roles(role_id);

-- ---------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------

CREATE TABLE audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    action        VARCHAR(20) NOT NULL,            -- CREATE | UPDATE | DELETE
    entity_type   VARCHAR(80) NOT NULL,            -- Group, LegalEntity, ...
    entity_id     UUID,
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    old_values    JSONB,
    new_values    JSONB,
    source_ip     INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_time   ON audit_logs(created_at DESC);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'groups','legal_entities','countries','business_units','departments',
        'users','roles','user_entity_roles','currencies'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at();',
            t, t
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- Seed: baseline system roles & a few common currencies
-- ---------------------------------------------------------------------

INSERT INTO currencies(code, name) VALUES
    ('USD','US Dollar'),('EUR','Euro'),('GBP','Pound Sterling'),
    ('INR','Indian Rupee'),('AED','UAE Dirham'),('SGD','Singapore Dollar'),
    ('CNY','Chinese Yuan')
ON CONFLICT DO NOTHING;

INSERT INTO roles(code, name, description, is_system) VALUES
    ('SUPER_ADMIN',       'Super Administrator', 'Full administrative privileges',                 TRUE),
    ('INITIATOR',         'Payments Initiator',  'Creates payment requests',                       TRUE),
    ('APPROVER',          'Approver',            'Approves payment requests',                      TRUE),
    ('PAYMENTS_MAKER',    'Payments Maker',      'Prepares and releases approved payments',        TRUE),
    ('PAYMENTS_CHECKER',  'Payments Checker',    'Independent check on sensitive payments',        TRUE),
    ('FINANCE_HEAD',      'Finance Head',        'Country / entity finance head',                  TRUE)
ON CONFLICT DO NOTHING;
