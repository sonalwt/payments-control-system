-- =====================================================================
-- Payments Control System — FULL DATABASE SCHEMA
-- Covers §1 – §9  (all migrations applied in order)
--
-- Usage (fresh database):
--   psql -U postgres -d pcs -f backend/src/database/full_schema.sql
--
-- NOTE: This file is generated from schema.sql + all migrations.
--       For production, prefer:  npm run migration:run
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive text

-- =====================================================================
-- §1.1 — Reference data: Currencies (base)
-- =====================================================================

CREATE TABLE currencies (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    code         CHAR(3) NOT NULL UNIQUE,
    name         VARCHAR(80) NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    numeric_code CHAR(3),
    minor_unit   SMALLINT NOT NULL DEFAULT 2,
    symbol       VARCHAR(8),
    is_system    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,
    created_by   UUID,
    updated_by   UUID,
    CONSTRAINT chk_currency_code CHECK (code ~ '^[A-Z]{3}$')
);
CREATE INDEX idx_currencies_active     ON currencies(is_active);
CREATE INDEX idx_currencies_deleted_at ON currencies(deleted_at) WHERE deleted_at IS NULL;

INSERT INTO currencies(code, name, numeric_code, minor_unit, symbol, is_system) VALUES
    ('USD','US Dollar',        '840', 2, '$',   TRUE),
    ('EUR','Euro',             '978', 2, '€',   TRUE),
    ('GBP','Pound Sterling',   '826', 2, '£',   TRUE),
    ('INR','Indian Rupee',     '356', 2, '₹',   TRUE),
    ('AED','UAE Dirham',       '784', 2, 'د.إ', TRUE),
    ('SGD','Singapore Dollar', '702', 2, 'S$',  TRUE),
    ('CNY','Chinese Yuan',     '156', 2, '¥',   TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- §1.1 — Org Hierarchy: Group → Legal Entity → Country → BU → Dept
-- =====================================================================

CREATE TABLE groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(30)  NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    created_by  UUID,
    updated_by  UUID,
    CONSTRAINT uq_group_name UNIQUE (name)
);
CREATE INDEX idx_groups_deleted_at ON groups(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE legal_entities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
    name                VARCHAR(200) NOT NULL,
    code                VARCHAR(30)  NOT NULL,
    registered_country  CHAR(2)      NOT NULL,
    base_currency_id    UUID         NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    approval_matrix_ref UUID,
    tax_identifier      VARCHAR(50),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID,
    updated_by          UUID,
    CONSTRAINT uq_legal_entity_name_per_group UNIQUE (group_id, name),
    CONSTRAINT uq_legal_entity_code_per_group UNIQUE (group_id, code)
);
CREATE INDEX idx_legal_entities_group_id   ON legal_entities(group_id);
CREATE INDEX idx_legal_entities_currency   ON legal_entities(base_currency_id);
CREATE INDEX idx_legal_entities_deleted_at ON legal_entities(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE countries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_entity_id UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    name            VARCHAR(120) NOT NULL,
    iso_code        CHAR(2)      NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_country_per_legal_entity UNIQUE (legal_entity_id, iso_code)
);
CREATE INDEX idx_countries_legal_entity_id ON countries(legal_entity_id);
CREATE INDEX idx_countries_deleted_at      ON countries(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE business_units (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id  UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(30)  NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    created_by  UUID,
    updated_by  UUID,
    CONSTRAINT uq_bu_name_per_country UNIQUE (country_id, name),
    CONSTRAINT uq_bu_code_per_country UNIQUE (country_id, code)
);
CREATE INDEX idx_business_units_country_id ON business_units(country_id);
CREATE INDEX idx_business_units_deleted_at ON business_units(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE departments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE RESTRICT,
    name             VARCHAR(150) NOT NULL,
    code             VARCHAR(30)  NOT NULL,
    description      TEXT,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,
    created_by       UUID,
    updated_by       UUID,
    CONSTRAINT uq_dept_name_per_bu UNIQUE (business_unit_id, name),
    CONSTRAINT uq_dept_code_per_bu UNIQUE (business_unit_id, code)
);
CREATE INDEX idx_departments_business_unit_id ON departments(business_unit_id);
CREATE INDEX idx_departments_deleted_at       ON departments(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================================
-- §1.1 — Identity & Access
-- =====================================================================

CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             CITEXT NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(150) NOT NULL,
    employee_code     VARCHAR(50)  UNIQUE,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ,
    created_by        UUID,
    updated_by        UUID
);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE user_entity_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
    legal_entity_id UUID NOT NULL REFERENCES legal_entities(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id)          ON DELETE RESTRICT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_user_entity_role UNIQUE (user_id, legal_entity_id, role_id)
);
CREATE INDEX idx_uer_user         ON user_entity_roles(user_id);
CREATE INDEX idx_uer_legal_entity ON user_entity_roles(legal_entity_id);
CREATE INDEX idx_uer_role         ON user_entity_roles(role_id);

-- §14 — Full role catalogue
INSERT INTO roles(code, name, description, is_system) VALUES
    ('SUPER_ADMIN',                'Super Administrator',          'Highest privilege; administrative reassignment, cooling-off overrides, emergency operations',                                  TRUE),
    ('SYSTEM_ADMIN',               'System Administrator',         'User management, master data, matrix and account configuration, sanctioned-country list, balance override',                    TRUE),
    ('INITIATOR',                  'Payments Initiator',           'Creates vendor payment requests and incoming receipt requests',                                                                 TRUE),
    ('HR_INITIATOR',               'HR Initiator',                 'Bulk-uploads payroll, creates reimbursement and FnF requests',                                                                  TRUE),
    ('APPROVER',                   'Approver',                     'Approves on mobile against requests routed by the approval matrix',                                                             TRUE),
    ('PAYROLL_APPROVER',           'Payroll Approver',             'Batch-level approval of payroll before processing',                                                                             TRUE),
    ('PAYMENTS_MAKER',             'Payments Team Maker',          'Verifies documents, prepares TTs, marks payments released and paid, uploads proof of payment',                                  TRUE),
    ('PAYMENTS_CHECKER',           'Payments Team Checker',        'Independent verifier on chairman payments and beneficiary change requests',                                                     TRUE),
    ('PAYMENTS_HEAD',              'Payments Head',                'Approves execution of chairman payments; senior payments-team oversight',                                                       TRUE),
    ('BENEFICIARY_CHANGE_MAKER',   'Beneficiary Change Maker',     'Creates bank account change requests under maker-checker',                                                                      TRUE),
    ('BENEFICIARY_CHANGE_VERIFIER','Beneficiary Change Verifier',  'Verifies bank account change requests under maker-checker',                                                                     TRUE),
    ('FINANCE_HEAD',               'Country / Entity Finance Head','Reviews and reports within entity or country scope',                                                                            TRUE),
    ('GROUP_TREASURER',            'Group Treasurer / CFO',        'Group-wide visibility and reporting; recipient for reconciliation exceptions',                                                   TRUE),
    ('CHAIRMAN',                   'Chairman',                     'Initiates chairman payments on mobile',                                                                                         TRUE),
    ('INTERNAL_AUDITOR',           'Internal Auditor',             'Read-only access across the system, including the full audit log',                                                              TRUE)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- Audit log
-- =====================================================================

CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    action      VARCHAR(20) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id   UUID,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    old_values  JSONB,
    new_values  JSONB,
    source_ip   INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_time   ON audit_logs(created_at DESC);

-- =====================================================================
-- updated_at trigger (applied to all tables below)
-- =====================================================================

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

-- =====================================================================
-- §1.2 — Payment Types
-- =====================================================================

CREATE TABLE payment_types (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(50)  NOT NULL,
    name                    VARCHAR(120) NOT NULL,
    description             TEXT,
    direction               VARCHAR(10)  NOT NULL,
    requires_approval_chain BOOLEAN NOT NULL DEFAULT TRUE,
    is_batch_based          BOOLEAN NOT NULL DEFAULT FALSE,
    is_confidential         BOOLEAN NOT NULL DEFAULT FALSE,
    mobile_initiation_only  BOOLEAN NOT NULL DEFAULT FALSE,
    allows_cross_currency   BOOLEAN NOT NULL DEFAULT TRUE,
    approval_matrix_ref     UUID,
    document_policy         JSONB NOT NULL DEFAULT '[]',
    field_config            JSONB NOT NULL DEFAULT '[]',
    is_system               BOOLEAN NOT NULL DEFAULT FALSE,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    version                 INT  NOT NULL DEFAULT 1,
    effective_from          DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to            DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,
    created_by              UUID,
    updated_by              UUID,
    CONSTRAINT chk_payment_type_direction          CHECK (direction IN ('OUTGOING','INCOMING')),
    CONSTRAINT chk_payment_type_chairman_no_chain  CHECK (NOT (is_confidential = TRUE AND requires_approval_chain = TRUE)),
    CONSTRAINT uq_payment_type_code_version        UNIQUE (code, version)
);
CREATE INDEX idx_payment_types_code       ON payment_types(code);
CREATE INDEX idx_payment_types_active     ON payment_types(is_active)   WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_types_deleted_at ON payment_types(deleted_at)  WHERE deleted_at IS NULL;
CREATE TRIGGER trg_payment_types_touch BEFORE UPDATE ON payment_types FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

INSERT INTO payment_types(code, name, description, direction, requires_approval_chain, is_batch_based, is_confidential, mobile_initiation_only, allows_cross_currency, document_policy, field_config, is_system) VALUES
    ('VENDOR_PAYMENT',  'Vendor Payment',               'Outgoing supplier-invoice settlement.',             'OUTGOING', TRUE,  FALSE, FALSE, FALSE, TRUE,  '[]', '[]', TRUE),
    ('PAYROLL',         'Payroll',                      'Bulk salary payments uploaded by HR.',              'OUTGOING', TRUE,  TRUE,  FALSE, FALSE, FALSE, '[]', '[]', TRUE),
    ('REIMBURSEMENT',   'Reimbursement',                'Employee out-of-pocket claim.',                     'OUTGOING', TRUE,  FALSE, FALSE, FALSE, TRUE,  '[]', '[]', TRUE),
    ('FNF',             'Full-and-Final Settlement',    'End-of-service settlement raised by HR.',           'OUTGOING', TRUE,  FALSE, FALSE, FALSE, TRUE,  '[]', '[]', TRUE),
    ('INCOMING_RECEIPT','Incoming Receipt',             'Inbound amount expected from a counterparty.',      'INCOMING', FALSE, FALSE, FALSE, FALSE, FALSE, '[]', '[]', TRUE),
    ('CHAIRMAN_PAYMENT','Chairman Payment',             'Confidential chairman-initiated payment.',          'OUTGOING', FALSE, FALSE, TRUE,  TRUE,  TRUE,  '[]', '[]', TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- §1.3 — Counterparty Master
-- =====================================================================

CREATE TABLE counterparties (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                  VARCHAR(40)  NOT NULL,
    name                  VARCHAR(200) NOT NULL,
    legal_name            VARCHAR(200),
    role                  VARCHAR(10)  NOT NULL,
    country_code          CHAR(2)      NOT NULL,
    tax_identifiers       JSONB NOT NULL DEFAULT '[]',
    addresses             JSONB NOT NULL DEFAULT '[]',
    primary_contact_name  VARCHAR(150),
    primary_contact_email VARCHAR(150),
    primary_contact_phone VARCHAR(50),
    notes                 TEXT,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,
    created_by            UUID,
    updated_by            UUID,
    CONSTRAINT uq_counterparty_code  UNIQUE (code),
    CONSTRAINT chk_counterparty_role CHECK (role IN ('VENDOR','CUSTOMER','BOTH'))
);
CREATE INDEX idx_counterparties_role       ON counterparties(role)         WHERE deleted_at IS NULL;
CREATE INDEX idx_counterparties_country    ON counterparties(country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_counterparties_active     ON counterparties(is_active)    WHERE deleted_at IS NULL;
CREATE INDEX idx_counterparties_deleted_at ON counterparties(deleted_at)   WHERE deleted_at IS NULL;
CREATE TRIGGER trg_counterparties_touch BEFORE UPDATE ON counterparties FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §1.4 — Employee Master
-- =====================================================================

CREATE TABLE employees (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code            VARCHAR(40)  NOT NULL,
    full_name                VARCHAR(150) NOT NULL,
    preferred_name           VARCHAR(150),
    work_email               CITEXT,
    legal_entity_id          UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    country_code             CHAR(2)      NOT NULL,
    base_currency_id         UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    payroll_category         VARCHAR(40)  NOT NULL,
    employee_bank_account_id UUID,
    employment_start_date    DATE,
    employment_end_date      DATE,
    national_id              VARCHAR(60),
    tax_identifier           VARCHAR(60),
    date_of_birth            DATE,
    compensation_band        VARCHAR(40),
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID,
    CONSTRAINT uq_employee_code_per_entity UNIQUE (legal_entity_id, employee_code),
    CONSTRAINT chk_employment_dates CHECK (employment_end_date IS NULL OR employment_end_date >= employment_start_date)
);
CREATE INDEX idx_employees_legal_entity ON employees(legal_entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_country      ON employees(country_code)    WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_active       ON employees(is_active)       WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_deleted_at   ON employees(deleted_at)      WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_bank_account ON employees(employee_bank_account_id);
CREATE TRIGGER trg_employees_touch BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §1.5 — Approval Matrix
-- =====================================================================

CREATE TABLE approval_matrices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(150) NOT NULL,
    description       TEXT,
    payment_type_code VARCHAR(50)  NOT NULL,
    version           INT          NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    effective_from    DATE         NOT NULL,
    effective_to      DATE,
    published_at      TIMESTAMPTZ,
    published_by      UUID,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ,
    created_by        UUID,
    updated_by        UUID,
    CONSTRAINT chk_approval_matrix_status    CHECK (status IN ('DRAFT','PUBLISHED','SUPERSEDED')),
    CONSTRAINT chk_approval_matrix_effective CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT uq_approval_matrix_pt_version UNIQUE (payment_type_code, version)
);
CREATE INDEX idx_am_payment_type ON approval_matrices(payment_type_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_am_status       ON approval_matrices(status)            WHERE deleted_at IS NULL;
CREATE INDEX idx_am_effective    ON approval_matrices(effective_from)    WHERE deleted_at IS NULL;
CREATE INDEX idx_am_deleted_at   ON approval_matrices(deleted_at)        WHERE deleted_at IS NULL;

CREATE TABLE approval_matrix_bands (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matrix_id        UUID    NOT NULL REFERENCES approval_matrices(id) ON DELETE CASCADE,
    currency_code    CHAR(3) NOT NULL,
    min_amount_minor BIGINT  NOT NULL,
    max_amount_minor BIGINT,
    sort_order       INT     NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_band_amounts                 CHECK (min_amount_minor >= 0 AND (max_amount_minor IS NULL OR max_amount_minor >= min_amount_minor)),
    CONSTRAINT uq_band_per_matrix_currency_min  UNIQUE (matrix_id, currency_code, min_amount_minor)
);
CREATE INDEX idx_amb_matrix   ON approval_matrix_bands(matrix_id);
CREATE INDEX idx_amb_currency ON approval_matrix_bands(matrix_id, currency_code);

CREATE TABLE approval_matrix_steps (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id          UUID NOT NULL REFERENCES approval_matrix_bands(id) ON DELETE CASCADE,
    step_order       INT  NOT NULL,
    approver_type    VARCHAR(10) NOT NULL,
    approver_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    approver_role_id UUID REFERENCES roles(id) ON DELETE RESTRICT,
    is_optional      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_step_type   CHECK (approver_type IN ('USER','ROLE')),
    CONSTRAINT chk_step_target CHECK (
        (approver_type = 'USER' AND approver_user_id IS NOT NULL AND approver_role_id IS NULL)
        OR
        (approver_type = 'ROLE' AND approver_role_id IS NOT NULL AND approver_user_id IS NULL)
    ),
    CONSTRAINT uq_step_per_band UNIQUE (band_id, step_order)
);
CREATE INDEX idx_ams_band ON approval_matrix_steps(band_id);
CREATE INDEX idx_ams_user ON approval_matrix_steps(approver_user_id);
CREATE INDEX idx_ams_role ON approval_matrix_steps(approver_role_id);

CREATE TRIGGER trg_approval_matrices_touch     BEFORE UPDATE ON approval_matrices     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_approval_matrix_bands_touch BEFORE UPDATE ON approval_matrix_bands FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_approval_matrix_steps_touch BEFORE UPDATE ON approval_matrix_steps FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §1.6 — Sanctioned Countries
-- =====================================================================

CREATE TABLE sanctioned_countries (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code CHAR(2)      NOT NULL,
    country_name VARCHAR(120) NOT NULL,
    reason       TEXT         NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,
    created_by   UUID,
    updated_by   UUID,
    CONSTRAINT chk_sanctioned_country_code CHECK (country_code ~ '^[A-Z]{2}$')
);
CREATE UNIQUE INDEX uq_sanctioned_country_code_live ON sanctioned_countries(country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_sanctioned_countries_active     ON sanctioned_countries(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_sanctioned_countries_deleted_at ON sanctioned_countries(deleted_at) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_sanctioned_countries_touch BEFORE UPDATE ON sanctioned_countries FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §2.2 — FX Rates
-- =====================================================================

CREATE TABLE fx_rates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency_code  CHAR(3)        NOT NULL,
    quote_currency_code CHAR(3)        NOT NULL,
    rate                DECIMAL(20,10) NOT NULL,
    as_of_date          DATE           NOT NULL,
    source              VARCHAR(20)    NOT NULL,
    fetched_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    provider_name       VARCHAR(50),
    override_reason     TEXT,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID,
    updated_by          UUID,
    CONSTRAINT chk_fx_rate_positive CHECK (rate > 0),
    CONSTRAINT chk_fx_rate_source   CHECK (source IN ('OANDA','MANUAL_OVERRIDE','STALE_HELD')),
    CONSTRAINT chk_fx_rate_base     CHECK (base_currency_code  ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_fx_rate_quote    CHECK (quote_currency_code ~ '^[A-Z]{3}$'),
    CONSTRAINT uq_fx_rate_base_quote_asof UNIQUE (base_currency_code, quote_currency_code, as_of_date)
);
CREATE INDEX idx_fx_rates_quote_date ON fx_rates(quote_currency_code, as_of_date);
CREATE INDEX idx_fx_rates_asof       ON fx_rates(as_of_date);
CREATE TRIGGER trg_fx_rates_touch BEFORE UPDATE ON fx_rates FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §2.3 — Bank Master
-- =====================================================================

CREATE TABLE banks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(150) NOT NULL,
    short_name   VARCHAR(50),
    country_code CHAR(2)      NOT NULL,
    swift_bic    VARCHAR(11),
    address      TEXT,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,
    created_by   UUID,
    updated_by   UUID,
    CONSTRAINT chk_banks_country CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT chk_banks_swift   CHECK (swift_bic IS NULL OR swift_bic ~ '^[A-Z0-9]{8}([A-Z0-9]{3})?$'),
    CONSTRAINT uq_banks_name_country UNIQUE (name, country_code)
);
CREATE INDEX idx_banks_country    ON banks(country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_banks_active     ON banks(is_active)    WHERE deleted_at IS NULL;
CREATE INDEX idx_banks_deleted_at ON banks(deleted_at)   WHERE deleted_at IS NULL;
CREATE TRIGGER trg_banks_touch BEFORE UPDATE ON banks FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §2.4 — Bank Account Master  (includes §9.2 is_chairman_designated)
-- =====================================================================

CREATE TABLE bank_accounts (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname               VARCHAR(120) NOT NULL,
    legal_entity_id        UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    bank_id                UUID NOT NULL REFERENCES banks(id)          ON DELETE RESTRICT,
    currency_id            UUID NOT NULL REFERENCES currencies(id)     ON DELETE RESTRICT,
    account_number         VARCHAR(50)  NOT NULL,
    iban                   VARCHAR(34),
    account_type           VARCHAR(12)  NOT NULL,
    branch_name            VARCHAR(120),
    branch_code            VARCHAR(30),
    balance                DECIMAL(20,4) NOT NULL DEFAULT 0,
    balance_as_of          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    balance_source         VARCHAR(30)   NOT NULL DEFAULT 'SEEDED',
    minimum_balance        DECIMAL(20,4),
    is_chairman_designated BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active              BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at             TIMESTAMPTZ,
    created_by             UUID,
    updated_by             UUID,
    CONSTRAINT chk_bank_account_type CHECK (account_type IN ('CURRENT','COLLATERAL','DEPOSIT')),
    CONSTRAINT chk_balance_source    CHECK (balance_source IN ('SEEDED','SYSTEM_COMPUTED','STATEMENT_RECONCILED','MANUAL_OVERRIDE')),
    CONSTRAINT chk_bank_account_min_balance CHECK (
        (account_type = 'CURRENT' AND minimum_balance IS NOT NULL)
        OR (account_type IN ('COLLATERAL','DEPOSIT') AND minimum_balance IS NULL)
    ),
    CONSTRAINT uq_bank_account_number_per_bank UNIQUE (bank_id, account_number)
);
CREATE INDEX idx_bank_accounts_entity     ON bank_accounts(legal_entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_bank       ON bank_accounts(bank_id)         WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_currency   ON bank_accounts(currency_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_type       ON bank_accounts(account_type)    WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_active     ON bank_accounts(is_active)       WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_deleted_at ON bank_accounts(deleted_at)      WHERE deleted_at IS NULL;
CREATE TRIGGER trg_bank_accounts_touch BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §2.5 — Balance Change Ledger
-- =====================================================================

CREATE TABLE balance_changes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    kind                VARCHAR(25) NOT NULL,
    previous_balance    DECIMAL(20,4) NOT NULL,
    new_balance         DECIMAL(20,4) NOT NULL,
    delta               DECIMAL(20,4) NOT NULL,
    reason              TEXT,
    payment_request_id  UUID,
    receipt_id          UUID,
    statement_upload_id UUID,
    changed_by          UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_balance_change_kind CHECK (kind IN (
        'PAYMENT_DEBIT','RECEIPT_CREDIT','STATEMENT_RESET',
        'MANUAL_OVERRIDE','PAYMENT_CORRECTION'
    ))
);
CREATE INDEX idx_balance_changes_account_time ON balance_changes(account_id, created_at DESC);
CREATE INDEX idx_balance_changes_kind         ON balance_changes(kind);

-- =====================================================================
-- §3 — Payment Lifecycle
-- =====================================================================

CREATE SEQUENCE IF NOT EXISTS payment_request_seq START 1;

CREATE TABLE payment_requests (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number           VARCHAR(30) NOT NULL UNIQUE,
    payment_type_code        VARCHAR(30) NOT NULL,
    legal_entity_id          UUID        NOT NULL REFERENCES legal_entities(id)  ON DELETE RESTRICT,
    counterparty_id          UUID        REFERENCES counterparties(id)            ON DELETE RESTRICT,
    employee_id              UUID        REFERENCES employees(id)                 ON DELETE RESTRICT,
    currency_code            CHAR(3)     NOT NULL,
    amount                   DECIMAL(20,4) NOT NULL,
    amount_minor             BIGINT      NOT NULL,
    purpose_description      TEXT,
    -- §8 vendor payment fields
    invoice_number           VARCHAR(60),
    due_date                 DATE,
    source_account_id        UUID        REFERENCES bank_accounts(id)            ON DELETE RESTRICT,
    is_cross_currency        BOOLEAN     NOT NULL DEFAULT FALSE,
    indicative_source_amount DECIMAL(20,4),
    bank_reference           VARCHAR(100),
    value_date               DATE,
    proof_of_payment_url     VARCHAR(500),
    status                   VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    submitted_at             TIMESTAMPTZ,
    approved_at              TIMESTAMPTZ,
    paid_at                  TIMESTAMPTZ,
    matrix_id                UUID,
    matrix_version           INTEGER,
    current_step_order       INTEGER,
    rejection_reason         TEXT,
    cancellation_reason      TEXT,
    maker_notes              TEXT,
    is_amount_locked         BOOLEAN     NOT NULL DEFAULT FALSE,
    sanction_warning         BOOLEAN     NOT NULL DEFAULT FALSE,
    -- §6.5
    sanction_override_reason TEXT,
    -- §6 beneficiary account
    beneficiary_account_id   UUID        REFERENCES beneficiary_accounts(id)     ON DELETE RESTRICT,
    counterparty_snapshot    JSONB,
    beneficiary_snapshot     JSONB,
    -- §9 chairman payment
    is_chairman_payment      BOOLEAN     NOT NULL DEFAULT FALSE,
    chairman_beneficiary_id  UUID,       -- FK added after chairman_beneficiaries table
    maker_prepared_at        TIMESTAMPTZ,
    checker_verified_at      TIMESTAMPTZ,
    head_approved_at         TIMESTAMPTZ,
    checker_notes            TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID,
    CONSTRAINT chk_pr_status CHECK (status IN (
        'DRAFT','PENDING_APPROVAL','APPROVED',
        'AWAITING_PAYMENT_CONFIRMATION','PAID',
        'REJECTED','WITHDRAWN','CANCELLED',
        'AWAITING_MAKER_PREP','AWAITING_CHECKER_REVIEW','AWAITING_HEAD_APPROVAL'
    )),
    CONSTRAINT chk_pr_currency        CHECK (currency_code ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_pr_amount_positive CHECK (amount > 0)
);
CREATE INDEX idx_payment_requests_deleted ON payment_requests(deleted_at)        WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_requests_status  ON payment_requests(status)            WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_requests_entity  ON payment_requests(legal_entity_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_requests_type    ON payment_requests(payment_type_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_requests_cp      ON payment_requests(counterparty_id)   WHERE counterparty_id IS NOT NULL;
CREATE INDEX idx_payment_requests_emp     ON payment_requests(employee_id)       WHERE employee_id IS NOT NULL;
CREATE INDEX idx_payment_requests_created ON payment_requests(created_at DESC)   WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_requests_invoice ON payment_requests(invoice_number)    WHERE invoice_number IS NOT NULL;
CREATE INDEX idx_payment_requests_bene    ON payment_requests(beneficiary_account_id) WHERE beneficiary_account_id IS NOT NULL;
CREATE TRIGGER trg_payment_requests_touch BEFORE UPDATE ON payment_requests FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE payment_request_approvals (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID        NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    step_order         INTEGER     NOT NULL,
    approver_type      VARCHAR(10) NOT NULL,
    approver_user_id   UUID,
    approver_role_id   UUID,
    is_optional        BOOLEAN     NOT NULL DEFAULT FALSE,
    decision           VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    decided_by         UUID,
    decided_at         TIMESTAMPTZ,
    comments           TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pra_approver_type CHECK (approver_type IN ('USER','ROLE')),
    CONSTRAINT chk_pra_decision      CHECK (decision IN ('PENDING','APPROVED','REJECTED'))
);
CREATE INDEX idx_pra_request  ON payment_request_approvals(payment_request_id);
CREATE INDEX idx_pra_user     ON payment_request_approvals(approver_user_id) WHERE approver_user_id IS NOT NULL;
CREATE INDEX idx_pra_role     ON payment_request_approvals(approver_role_id) WHERE approver_role_id IS NOT NULL;
CREATE INDEX idx_pra_decision ON payment_request_approvals(decision);

CREATE TABLE payment_request_documents (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID         NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    document_code      VARCHAR(50)  NOT NULL,
    document_label     VARCHAR(200),
    file_name          VARCHAR(255) NOT NULL,
    file_url           VARCHAR(500) NOT NULL,
    file_size_bytes    INTEGER,
    mime_type          VARCHAR(100),
    uploaded_by        UUID,
    uploaded_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_prd_request ON payment_request_documents(payment_request_id);

-- =====================================================================
-- §5 — Payroll Batches
-- =====================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_batch_status') THEN
    CREATE TYPE payroll_batch_status AS ENUM ('VALIDATION_FAILED','DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED');
  END IF;
END $$;
CREATE SEQUENCE IF NOT EXISTS payroll_batch_seq START 1;

CREATE TABLE payroll_batches (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number     TEXT NOT NULL UNIQUE,
    legal_entity_id  UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    period_label     TEXT NOT NULL,
    currency_code    CHAR(3) NOT NULL,
    total_gross_minor BIGINT NOT NULL DEFAULT 0,
    total_net_minor  BIGINT NOT NULL DEFAULT 0,
    employee_count   INT NOT NULL DEFAULT 0,
    variance_flag    BOOLEAN NOT NULL DEFAULT FALSE,
    headcount_delta  INT,
    sanity_notes     TEXT,
    status           payroll_batch_status NOT NULL DEFAULT 'DRAFT',
    file_url         TEXT NOT NULL,
    uploaded_by      UUID REFERENCES users(id),
    submitted_at     TIMESTAMPTZ,
    approved_by      UUID REFERENCES users(id),
    approved_at      TIMESTAMPTZ,
    rejected_by      UUID REFERENCES users(id),
    rejected_at      TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,
    created_by       UUID,
    updated_by       UUID
);

CREATE TABLE payroll_batch_items (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id               UUID NOT NULL REFERENCES payroll_batches(id) ON DELETE CASCADE,
    employee_id            UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    beneficiary_account_id UUID REFERENCES beneficiary_accounts(id),
    gross_amount_minor     BIGINT NOT NULL,
    net_amount_minor       BIGINT NOT NULL,
    deductions_minor       BIGINT NOT NULL DEFAULT 0,
    payslip_url            TEXT,
    variance_flag          BOOLEAN NOT NULL DEFAULT FALSE,
    previous_net_minor     BIGINT,
    variance_pct           NUMERIC(6,2),
    payment_request_id     UUID REFERENCES payment_requests(id),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- §5.4 — Employee Bank Account Change Control (EBAC)
-- =====================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ebac_change_type') THEN
    CREATE TYPE ebac_change_type AS ENUM ('ADD','MODIFY','DEACTIVATE');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ebac_status') THEN
    CREATE TYPE ebac_status AS ENUM ('PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','CANCELLED');
  END IF;
END $$;

CREATE TABLE employee_bank_account_changes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id        UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    change_type        ebac_change_type NOT NULL,
    status             ebac_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    proposed_data      JSONB NOT NULL DEFAULT '{}',
    documents          JSONB NOT NULL DEFAULT '[]',
    anomaly_flag       BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_notes      TEXT,
    requested_by       UUID NOT NULL REFERENCES users(id),
    verified_by        UUID REFERENCES users(id),
    verified_at        TIMESTAMPTZ,
    verification_notes TEXT,
    callback_evidence  TEXT,
    approved_by        UUID REFERENCES users(id),
    approved_at        TIMESTAMPTZ,
    rejected_by        UUID REFERENCES users(id),
    rejected_at        TIMESTAMPTZ,
    rejection_reason   TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ,
    created_by         UUID,
    updated_by         UUID,
    CONSTRAINT ebac_maker_checker CHECK (verified_by IS NULL OR verified_by <> requested_by)
);

-- =====================================================================
-- §6 — Beneficiary Accounts
-- =====================================================================

CREATE TABLE beneficiary_accounts (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    counterparty_id     UUID        REFERENCES counterparties(id) ON DELETE RESTRICT,
    employee_id         UUID        REFERENCES employees(id)      ON DELETE RESTRICT,
    account_holder_name VARCHAR(200) NOT NULL,
    account_number      VARCHAR(60)  NOT NULL,
    bank_id             UUID        NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
    bank_name           VARCHAR(150),
    branch_name         VARCHAR(120),
    swift_bic           VARCHAR(11),
    iban                VARCHAR(34),
    currency_id         UUID        NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    country_code        CHAR(2)     NOT NULL,
    status              VARCHAR(25) NOT NULL DEFAULT 'PENDING_ACTIVATION',
    cooling_off_until   TIMESTAMPTZ,
    account_direction   VARCHAR(15) NOT NULL DEFAULT 'PAY_TO',
    anomaly_flag        BOOLEAN     NOT NULL DEFAULT FALSE,
    anomaly_notes       TEXT,
    sanction_warning    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID,
    updated_by          UUID,
    CONSTRAINT chk_bene_owner   CHECK ((counterparty_id IS NOT NULL AND employee_id IS NULL) OR (counterparty_id IS NULL AND employee_id IS NOT NULL)),
    CONSTRAINT chk_bene_status  CHECK (status IN ('PENDING_ACTIVATION','ACTIVE','INACTIVE')),
    CONSTRAINT chk_bene_country CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT uq_bene_account_bank UNIQUE (bank_id, account_number)
);
CREATE INDEX idx_bene_counterparty ON beneficiary_accounts(counterparty_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bene_employee     ON beneficiary_accounts(employee_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_bene_status       ON beneficiary_accounts(status)          WHERE deleted_at IS NULL;
CREATE INDEX idx_bene_country      ON beneficiary_accounts(country_code)    WHERE deleted_at IS NULL;
CREATE INDEX idx_bene_deleted_at   ON beneficiary_accounts(deleted_at)      WHERE deleted_at IS NULL;
CREATE TRIGGER trg_beneficiary_accounts_touch BEFORE UPDATE ON beneficiary_accounts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Back-fill FK on employees
DO $$ BEGIN
    ALTER TABLE employees ADD CONSTRAINT fk_employee_bene_account
        FOREIGN KEY (employee_bank_account_id) REFERENCES beneficiary_accounts(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Also add back-reference from payment_requests (already defined inline above)
-- but we need to add the FK now that beneficiary_accounts exists
DO $$ BEGIN
    ALTER TABLE payment_requests ADD CONSTRAINT fk_pr_beneficiary_account
        FOREIGN KEY (beneficiary_account_id) REFERENCES beneficiary_accounts(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE beneficiary_account_change_requests (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_account_id UUID        REFERENCES beneficiary_accounts(id) ON DELETE RESTRICT,
    change_type            VARCHAR(12) NOT NULL,
    status                 VARCHAR(25) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    proposed_data          JSONB       NOT NULL DEFAULT '{}',
    documents              JSONB       NOT NULL DEFAULT '[]',
    anomaly_flag           BOOLEAN     NOT NULL DEFAULT FALSE,
    anomaly_notes          TEXT,
    requested_by           UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    verified_by            UUID        REFERENCES users(id) ON DELETE RESTRICT,
    verified_at            TIMESTAMPTZ,
    verification_notes     TEXT,
    callback_evidence      TEXT,
    approved_by            UUID        REFERENCES users(id) ON DELETE RESTRICT,
    approved_at            TIMESTAMPTZ,
    rejected_by            UUID        REFERENCES users(id) ON DELETE RESTRICT,
    rejected_at            TIMESTAMPTZ,
    rejection_reason       TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at             TIMESTAMPTZ,
    created_by             UUID,
    updated_by             UUID,
    CONSTRAINT chk_bacr_type         CHECK (change_type IN ('ADD','MODIFY','DEACTIVATE')),
    CONSTRAINT chk_bacr_status       CHECK (status IN ('PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','CANCELLED')),
    CONSTRAINT chk_bacr_maker_checker CHECK (verified_by IS NULL OR verified_by <> requested_by)
);
CREATE INDEX idx_bacr_bene    ON beneficiary_account_change_requests(beneficiary_account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bacr_status  ON beneficiary_account_change_requests(status)                 WHERE deleted_at IS NULL;
CREATE INDEX idx_bacr_reqby   ON beneficiary_account_change_requests(requested_by)           WHERE deleted_at IS NULL;
CREATE INDEX idx_bacr_deleted ON beneficiary_account_change_requests(deleted_at)             WHERE deleted_at IS NULL;
CREATE TRIGGER trg_bacr_touch BEFORE UPDATE ON beneficiary_account_change_requests FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §7 — Exception Reports (proof-of-payment)
-- =====================================================================

CREATE TABLE exception_reports (
    id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date   DATE    NOT NULL,
    total_missing INTEGER NOT NULL DEFAULT 0,
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exception_report_date UNIQUE (report_date)
);
CREATE INDEX idx_exception_reports_date ON exception_reports(report_date DESC);

CREATE TABLE exception_report_items (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id          UUID        NOT NULL REFERENCES exception_reports(id) ON DELETE CASCADE,
    payment_request_id UUID        NOT NULL REFERENCES payment_requests(id)  ON DELETE CASCADE,
    request_number     VARCHAR(30) NOT NULL,
    legal_entity_name  VARCHAR(200),
    currency_code      VARCHAR(10) NOT NULL,
    amount             NUMERIC(20,6) NOT NULL,
    paid_at            TIMESTAMPTZ NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exception_report_items_report ON exception_report_items(report_id);

-- =====================================================================
-- §7 — Incoming Receipts
-- =====================================================================

CREATE SEQUENCE IF NOT EXISTS incoming_receipt_seq START 1 INCREMENT 1;

CREATE TABLE incoming_receipts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number          VARCHAR(30) NOT NULL UNIQUE,
    legal_entity_id         UUID NOT NULL REFERENCES legal_entities(id)  ON DELETE RESTRICT,
    counterparty_id         UUID NOT NULL REFERENCES counterparties(id)  ON DELETE RESTRICT,
    receive_from_account_id UUID NOT NULL REFERENCES bank_accounts(id)   ON DELETE RESTRICT,
    expected_amount         NUMERIC(20,4) NOT NULL,
    expected_currency_code  CHAR(3)       NOT NULL,
    purpose_description     TEXT,
    status                  VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
    submitted_at            TIMESTAMPTZ,
    received_at             TIMESTAMPTZ,
    received_amount         NUMERIC(20,4),
    received_currency_code  CHAR(3),
    inward_bank_reference   VARCHAR(100),
    received_remarks        TEXT,
    cancellation_reason     TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,
    created_by              UUID,
    updated_by              UUID,
    CONSTRAINT chk_ir_status         CHECK (status IN ('DRAFT','AWAITING_RECEIPT','RECEIVED','CANCELLED')),
    CONSTRAINT chk_ir_amount_positive CHECK (expected_amount > 0),
    CONSTRAINT chk_ir_currency        CHECK (expected_currency_code ~ '^[A-Z]{3}$')
);
CREATE INDEX idx_ir_status       ON incoming_receipts(status)                 WHERE deleted_at IS NULL;
CREATE INDEX idx_ir_entity       ON incoming_receipts(legal_entity_id)        WHERE deleted_at IS NULL;
CREATE INDEX idx_ir_counterparty ON incoming_receipts(counterparty_id)        WHERE deleted_at IS NULL;
CREATE INDEX idx_ir_account      ON incoming_receipts(receive_from_account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ir_created      ON incoming_receipts(created_at DESC)        WHERE deleted_at IS NULL;
CREATE INDEX idx_ir_deleted      ON incoming_receipts(deleted_at)             WHERE deleted_at IS NULL;
CREATE TRIGGER trg_incoming_receipts_touch BEFORE UPDATE ON incoming_receipts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE incoming_receipt_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incoming_receipt_id UUID NOT NULL REFERENCES incoming_receipts(id) ON DELETE CASCADE,
    document_code       VARCHAR(50)  NOT NULL,
    document_label      VARCHAR(200),
    file_name           VARCHAR(255) NOT NULL,
    file_url            VARCHAR(500) NOT NULL,
    file_size_bytes     INTEGER,
    mime_type           VARCHAR(100),
    uploaded_by         UUID,
    uploaded_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_ird_receipt ON incoming_receipt_documents(incoming_receipt_id);

-- =====================================================================
-- §8 — Bank Statement Uploads
-- =====================================================================

CREATE TABLE statement_uploads (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id          UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
    file_name                VARCHAR(255) NOT NULL,
    file_url                 VARCHAR(500) NOT NULL,
    file_size_bytes          INTEGER,
    uploaded_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    upload_date              DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start             DATE,
    period_end               DATE,
    closing_balance          NUMERIC(20,4),
    currency_code            CHAR(3),
    notes                    TEXT,
    -- §8 reconciliation summary columns
    ingestion_status         VARCHAR(20),
    ingestion_format         VARCHAR(10),
    ingestion_error          TEXT,
    auto_match_completed_at  TIMESTAMPTZ,
    matched_count            INTEGER,
    candidate_count          INTEGER,
    exception_count          INTEGER,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID
);
CREATE INDEX idx_su_account    ON statement_uploads(bank_account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_su_date       ON statement_uploads(upload_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_su_deleted_at ON statement_uploads(deleted_at)       WHERE deleted_at IS NULL;
CREATE TRIGGER trg_statement_uploads_touch BEFORE UPDATE ON statement_uploads FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- §8 — Statement Lines & Reconciliation Exceptions
-- =====================================================================

CREATE TABLE statement_lines (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_upload_id         UUID NOT NULL REFERENCES statement_uploads(id) ON DELETE CASCADE,
    bank_account_id             UUID NOT NULL REFERENCES bank_accounts(id)     ON DELETE RESTRICT,
    line_index                  INTEGER NOT NULL,
    value_date                  DATE    NOT NULL,
    posting_date                DATE,
    direction                   VARCHAR(6) NOT NULL,
    amount                      NUMERIC(20,4) NOT NULL,
    currency_code               CHAR(3) NOT NULL,
    bank_reference              VARCHAR(100),
    counterparty_text           TEXT,
    narrative                   TEXT,
    running_balance             NUMERIC(20,4),
    match_status                VARCHAR(20) NOT NULL DEFAULT 'UNMATCHED',
    matched_payment_request_id  UUID REFERENCES payment_requests(id) ON DELETE SET NULL,
    matched_incoming_receipt_id UUID REFERENCES incoming_receipts(id) ON DELETE SET NULL,
    match_score                 NUMERIC(5,2),
    match_reason                TEXT,
    matched_at                  TIMESTAMPTZ,
    matched_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
    exception_id                UUID,
    raw_row                     JSONB,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_sl_direction    CHECK (direction IN ('DEBIT','CREDIT')),
    CONSTRAINT chk_sl_match_status CHECK (match_status IN ('UNMATCHED','CANDIDATE','MATCHED','EXCEPTION')),
    CONSTRAINT chk_sl_amount_positive CHECK (amount > 0),
    CONSTRAINT uq_sl_upload_index   UNIQUE (statement_upload_id, line_index)
);
CREATE INDEX idx_sl_upload       ON statement_lines(statement_upload_id);
CREATE INDEX idx_sl_account_date ON statement_lines(bank_account_id, value_date DESC);
CREATE INDEX idx_sl_match_status ON statement_lines(match_status);
CREATE INDEX idx_sl_pr           ON statement_lines(matched_payment_request_id) WHERE matched_payment_request_id IS NOT NULL;
CREATE INDEX idx_sl_ir           ON statement_lines(matched_incoming_receipt_id) WHERE matched_incoming_receipt_id IS NOT NULL;
CREATE INDEX idx_sl_bank_ref     ON statement_lines(bank_reference) WHERE bank_reference IS NOT NULL;
CREATE TRIGGER trg_statement_lines_touch BEFORE UPDATE ON statement_lines FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE SEQUENCE IF NOT EXISTS reconciliation_exception_seq START 1 INCREMENT 1;

CREATE TABLE reconciliation_exceptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_number    VARCHAR(30) NOT NULL UNIQUE,
    statement_upload_id UUID NOT NULL REFERENCES statement_uploads(id)  ON DELETE CASCADE,
    statement_line_id   UUID NOT NULL UNIQUE REFERENCES statement_lines(id) ON DELETE CASCADE,
    bank_account_id     UUID NOT NULL REFERENCES bank_accounts(id)      ON DELETE RESTRICT,
    exception_type      VARCHAR(30) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    amount              NUMERIC(20,4) NOT NULL,
    currency_code       CHAR(3)      NOT NULL,
    value_date          DATE         NOT NULL,
    bank_reference      VARCHAR(100),
    counterparty_text   TEXT,
    narrative           TEXT,
    resolution_note     TEXT,
    investigated_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    investigated_at     TIMESTAMPTZ,
    resolved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_re_type   CHECK (exception_type IN ('UNAUTHORISED_PAYMENT','UNIDENTIFIED_RECEIPT')),
    CONSTRAINT chk_re_status CHECK (status IN ('OPEN','UNDER_INVESTIGATION','RESOLVED_WITH_JUSTIFICATION','CONFIRMED_EXCEPTION'))
);
CREATE INDEX idx_re_status  ON reconciliation_exceptions(status);
CREATE INDEX idx_re_account ON reconciliation_exceptions(bank_account_id);
CREATE INDEX idx_re_type    ON reconciliation_exceptions(exception_type);
CREATE INDEX idx_re_upload  ON reconciliation_exceptions(statement_upload_id);
CREATE TRIGGER trg_reconciliation_exceptions_touch BEFORE UPDATE ON reconciliation_exceptions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Back-reference FK now that exceptions table exists
DO $$ BEGIN
    ALTER TABLE statement_lines ADD CONSTRAINT fk_sl_exception
        FOREIGN KEY (exception_id) REFERENCES reconciliation_exceptions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX idx_sl_exception ON statement_lines(exception_id) WHERE exception_id IS NOT NULL;

-- =====================================================================
-- §9 — Chairman Beneficiaries
-- =====================================================================

CREATE TABLE chairman_beneficiaries (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_holder_name      VARCHAR(200) NOT NULL,
    account_number           VARCHAR(60)  NOT NULL,
    bank_id                  UUID NOT NULL REFERENCES banks(id)      ON DELETE RESTRICT,
    bank_name                VARCHAR(150),
    branch_name              VARCHAR(120),
    swift_bic                VARCHAR(11),
    iban                     VARCHAR(34),
    currency_id              UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    country_code             CHAR(2) NOT NULL,
    status                   VARCHAR(25) NOT NULL DEFAULT 'PENDING_ACTIVATION'
        CONSTRAINT chk_cb_status CHECK (status IN ('PENDING_ACTIVATION','ACTIVE','INACTIVE')),
    cooling_off_until        TIMESTAMPTZ,
    anomaly_flag             BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_notes            TEXT,
    sanction_warning         BOOLEAN NOT NULL DEFAULT FALSE,
    sanction_override_reason TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID
);
CREATE INDEX idx_cb_status ON chairman_beneficiaries(status);
CREATE TRIGGER trg_chairman_beneficiaries_touch BEFORE UPDATE ON chairman_beneficiaries FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE chairman_beneficiary_change_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chairman_beneficiary_id UUID REFERENCES chairman_beneficiaries(id) ON DELETE RESTRICT,
    change_type             VARCHAR(12) NOT NULL
        CONSTRAINT chk_cbcr_type CHECK (change_type IN ('ADD','MODIFY','DEACTIVATE')),
    status                  VARCHAR(25) NOT NULL DEFAULT 'PENDING_VERIFICATION'
        CONSTRAINT chk_cbcr_status CHECK (status IN ('PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','CANCELLED')),
    proposed_data           JSONB NOT NULL DEFAULT '{}',
    documents               JSONB NOT NULL DEFAULT '[]',
    anomaly_flag            BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_notes           TEXT,
    sanction_warning        BOOLEAN NOT NULL DEFAULT FALSE,
    sanction_override_reason TEXT,
    requested_by            UUID NOT NULL,
    verified_by             UUID,
    verified_at             TIMESTAMPTZ,
    verification_notes      TEXT,
    callback_evidence       TEXT,
    approved_by             UUID,
    approved_at             TIMESTAMPTZ,
    rejected_by             UUID,
    rejected_at             TIMESTAMPTZ,
    rejection_reason        TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,
    created_by              UUID,
    updated_by              UUID,
    CONSTRAINT chk_cbcr_maker_checker CHECK (verified_by IS NULL OR verified_by <> requested_by)
);
CREATE INDEX idx_cbcr_status ON chairman_beneficiary_change_requests(status);
CREATE INDEX idx_cbcr_reqby  ON chairman_beneficiary_change_requests(requested_by);
CREATE TRIGGER trg_cbcr_touch BEFORE UPDATE ON chairman_beneficiary_change_requests FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- §9 FK on payment_requests (table exists now)
DO $$ BEGIN
    ALTER TABLE payment_requests ADD CONSTRAINT fk_pr_chairman_beneficiary
        FOREIGN KEY (chairman_beneficiary_id) REFERENCES chairman_beneficiaries(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX idx_pr_chairman_bene ON payment_requests(chairman_beneficiary_id) WHERE chairman_beneficiary_id IS NOT NULL;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
