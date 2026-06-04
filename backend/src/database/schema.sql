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

-- Section 14 — full role catalogue (SoW User Roles and Access Control).
INSERT INTO roles(code, name, description, is_system) VALUES
    ('SUPER_ADMIN',                'Super Administrator',         'Highest privilege; administrative reassignment, cooling-off overrides, emergency operations',  TRUE),
    ('SYSTEM_ADMIN',               'System Administrator',        'User management, master data, matrix and account configuration, sanctioned-country list, balance override', TRUE),
    ('INITIATOR',                  'Payments Initiator',          'Creates vendor payment requests and incoming receipt requests',                                TRUE),
    ('HR_INITIATOR',               'HR Initiator',                'Bulk-uploads payroll, creates reimbursement and FnF requests',                                 TRUE),
    ('APPROVER',                   'Approver',                    'Approves on mobile against requests routed by the approval matrix',                            TRUE),
    ('PAYROLL_APPROVER',           'Payroll Approver',            'Batch-level approval of payroll before processing',                                            TRUE),
    ('PAYMENTS_MAKER',             'Payments Team Maker',         'Verifies documents, prepares TTs, marks payments released and paid, uploads proof of payment', TRUE),
    ('PAYMENTS_CHECKER',           'Payments Team Checker',       'Independent verifier on chairman payments and beneficiary change requests',                    TRUE),
    ('PAYMENTS_HEAD',              'Payments Head',               'Approves execution of chairman payments; senior payments-team oversight',                      TRUE),
    ('BENEFICIARY_CHANGE_MAKER',   'Beneficiary Change Maker',    'Creates bank account change requests under maker-checker',                                     TRUE),
    ('BENEFICIARY_CHANGE_VERIFIER','Beneficiary Change Verifier', 'Verifies bank account change requests under maker-checker',                                    TRUE),
    ('FINANCE_HEAD',               'Country / Entity Finance Head','Reviews and reports within entity or country scope',                                          TRUE),
    ('GROUP_TREASURER',            'Group Treasurer / CFO',       'Group-wide visibility and reporting; recipient for reconciliation exceptions',                 TRUE),
    ('CHAIRMAN',                   'Chairman',                    'Initiates chairman payments on mobile',                                                        TRUE),
    ('INTERNAL_AUDITOR',           'Internal Auditor',            'Read-only access across the system, including the full audit log',                             TRUE)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- Section 1.2 — Payment Types
-- Configurable catalogue. Each type carries workflow flags, a forward
-- reference to its approval matrix (populated when matrices exist in 1.5),
-- a document-attachment policy and a field-level configuration.
-- Effective-dated versioning per Section 1 master-data convention.
-- =====================================================================

CREATE TABLE payment_types (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                      VARCHAR(50)  NOT NULL,
    name                      VARCHAR(120) NOT NULL,
    description               TEXT,
    -- OUTGOING (vendor, payroll, reimbursement, FnF, chairman) | INCOMING (receipts)
    direction                 VARCHAR(10)  NOT NULL,
    -- Workflow behaviour
    requires_approval_chain   BOOLEAN NOT NULL DEFAULT TRUE,
    is_batch_based            BOOLEAN NOT NULL DEFAULT FALSE,
    is_confidential           BOOLEAN NOT NULL DEFAULT FALSE,
    mobile_initiation_only    BOOLEAN NOT NULL DEFAULT FALSE,
    allows_cross_currency     BOOLEAN NOT NULL DEFAULT TRUE,
    -- Forward reference; matrix lives in Section 1.5
    approval_matrix_ref       UUID,
    -- Legal entity this payment type belongs to (required). A request's
    -- legal entity is derived from its payment type.
    legal_entity_id           UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    -- Document-attachment policy: array of
    --   { code, label, required, amountThresholdMinor?, currencyCode? }
    -- Field-level configuration: array of
    --   { key, label, visible, required, readOnly, sortOrder, helpText? }
    field_config              JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- System types are seeded by the platform and cannot be deleted
    is_system                 BOOLEAN NOT NULL DEFAULT FALSE,
    is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
    -- Effective-dated versioning. Changes do not affect requests already in flight.
    version                   INT  NOT NULL DEFAULT 1,
    effective_from            DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to              DATE,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                TIMESTAMPTZ,
    created_by                UUID,
    updated_by                UUID,
    CONSTRAINT chk_payment_type_direction CHECK (direction IN ('OUTGOING','INCOMING')),
    CONSTRAINT chk_payment_type_chairman_no_chain CHECK (
        NOT (is_confidential = TRUE AND requires_approval_chain = TRUE)
    ),
    CONSTRAINT uq_payment_type_code_version UNIQUE (code, version)
);
CREATE INDEX idx_payment_types_code        ON payment_types(code);
CREATE INDEX idx_payment_types_active      ON payment_types(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_types_deleted_at  ON payment_types(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_types_legal_entity_id ON payment_types(legal_entity_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_payment_types_touch
    BEFORE UPDATE ON payment_types
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------------------------------------------------------------------
-- Seed the six payment types named in the SOW (Section 1.2)
-- ---------------------------------------------------------------------
INSERT INTO payment_types(
    code, name, description, direction,
    requires_approval_chain, is_batch_based, is_confidential,
    mobile_initiation_only, allows_cross_currency,
    field_config, is_system
) VALUES
    ('VENDOR_PAYMENT',  'Vendor Payment',
        'Outgoing supplier-invoice settlement.', 'OUTGOING',
        TRUE, FALSE, FALSE, FALSE, TRUE,
        '[
            {"key":"counterpartyId","label":"Counterparty","visible":true,"required":true,"readOnly":false,"sortOrder":10},
            {"key":"invoiceNumber","label":"Invoice Number","visible":true,"required":true,"readOnly":false,"sortOrder":20,"helpText":"Alphanumeric, no spaces"},
            {"key":"amount","label":"Amount","visible":true,"required":true,"readOnly":false,"sortOrder":30},
            {"key":"currencyId","label":"Currency","visible":true,"required":true,"readOnly":false,"sortOrder":40},
            {"key":"dueDate","label":"Due Date","visible":true,"required":true,"readOnly":false,"sortOrder":50},
            {"key":"beneficiaryAccountId","label":"Destination Beneficiary Account","visible":true,"required":true,"readOnly":false,"sortOrder":60}
         ]'::jsonb,
        TRUE),

    ('PAYROLL',         'Payroll',
        'Bulk salary payments uploaded by HR.', 'OUTGOING',
        TRUE, TRUE, FALSE, FALSE, FALSE,
        '[
            {"key":"employeeId","label":"Employee","visible":true,"required":true,"readOnly":false,"sortOrder":10},
            {"key":"netAmount","label":"Net Pay","visible":true,"required":true,"readOnly":false,"sortOrder":20},
            {"key":"grossAmount","label":"Gross Pay","visible":true,"required":true,"readOnly":false,"sortOrder":30},
            {"key":"deductions","label":"Deductions","visible":true,"required":true,"readOnly":false,"sortOrder":40},
            {"key":"period","label":"Pay Period","visible":true,"required":true,"readOnly":false,"sortOrder":50}
         ]'::jsonb,
        TRUE),

    ('REIMBURSEMENT',   'Reimbursement',
        'Employee out-of-pocket claim.', 'OUTGOING',
        TRUE, FALSE, FALSE, FALSE, TRUE,
        '[
            {"key":"employeeId","label":"Employee","visible":true,"required":true,"readOnly":false,"sortOrder":10},
            {"key":"amount","label":"Amount","visible":true,"required":true,"readOnly":false,"sortOrder":20},
            {"key":"currencyId","label":"Currency","visible":true,"required":true,"readOnly":false,"sortOrder":30},
            {"key":"purpose","label":"Purpose","visible":true,"required":true,"readOnly":false,"sortOrder":40}
         ]'::jsonb,
        TRUE),

    ('FNF',             'Full-and-Final Settlement',
        'End-of-service settlement raised by HR.', 'OUTGOING',
        TRUE, FALSE, FALSE, FALSE, TRUE,
        '[
            {"key":"employeeId","label":"Employee","visible":true,"required":true,"readOnly":false,"sortOrder":10},
            {"key":"lastWorkingDay","label":"Last Working Day","visible":true,"required":true,"readOnly":false,"sortOrder":20},
            {"key":"netAmount","label":"Net Settlement Amount","visible":true,"required":true,"readOnly":false,"sortOrder":30},
            {"key":"currencyId","label":"Currency","visible":true,"required":true,"readOnly":false,"sortOrder":40}
         ]'::jsonb,
        TRUE),

    ('INCOMING_RECEIPT','Incoming Receipt',
        'Inbound amount expected from a counterparty.', 'INCOMING',
        FALSE, FALSE, FALSE, FALSE, FALSE,
        '[
            {"key":"counterpartyId","label":"Counterparty","visible":true,"required":true,"readOnly":false,"sortOrder":10},
            {"key":"expectedAmount","label":"Expected Amount","visible":true,"required":true,"readOnly":false,"sortOrder":20},
            {"key":"currencyId","label":"Currency","visible":true,"required":true,"readOnly":false,"sortOrder":30},
            {"key":"receiveFromAccountId","label":"Receive-from Account","visible":true,"required":true,"readOnly":false,"sortOrder":40}
         ]'::jsonb,
        TRUE),

    ('CHAIRMAN',        'Chairman Payment',
        'Confidential chairman-initiated payment. Mobile initiation only.', 'OUTGOING',
        FALSE, FALSE, TRUE, TRUE, TRUE,
        '[
            {"key":"beneficiaryAccountId","label":"Destination Beneficiary Account","visible":true,"required":true,"readOnly":false,"sortOrder":10},
            {"key":"amount","label":"Amount","visible":true,"required":true,"readOnly":false,"sortOrder":20},
            {"key":"currencyId","label":"Currency","visible":true,"required":true,"readOnly":false,"sortOrder":30},
            {"key":"narrative","label":"Narrative","visible":true,"required":false,"readOnly":false,"sortOrder":40}
         ]'::jsonb,
        TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- Section 1.3 — Counterparty Master (Vendors and Customers)
-- Unified master. role = VENDOR | CUSTOMER | BOTH.
-- Beneficiary bank accounts live in their own master (Section 6) and
-- reference this table; account changes flow through the dedicated
-- bank account change control workflow.
-- =====================================================================

CREATE TABLE counterparties (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                     VARCHAR(40)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    legal_name               VARCHAR(200),
    role                     VARCHAR(10)  NOT NULL,    -- VENDOR | CUSTOMER | BOTH
    country_code             CHAR(2)      NOT NULL,    -- ISO 3166-1 alpha-2
    -- Tax identifiers vary by jurisdiction (TRN, GSTIN, VAT, etc.).
    -- Each entry: { type: 'TRN'|'GSTIN'|'VAT'|'PAN'|'EIN'|'OTHER', value, label? }
    tax_identifiers          JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Each entry: { label, line1, line2?, city, state?, postalCode?, isPrimary }
    addresses                JSONB NOT NULL DEFAULT '[]'::jsonb,
    primary_contact_name     VARCHAR(150),
    primary_contact_email    VARCHAR(150),
    primary_contact_phone    VARCHAR(50),
    notes                    TEXT,
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID,
    CONSTRAINT uq_counterparty_code UNIQUE (code),
    CONSTRAINT chk_counterparty_role CHECK (role IN ('VENDOR','CUSTOMER','BOTH'))
);
CREATE INDEX idx_counterparties_role        ON counterparties(role)         WHERE deleted_at IS NULL;
CREATE INDEX idx_counterparties_country     ON counterparties(country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_counterparties_active      ON counterparties(is_active)    WHERE deleted_at IS NULL;
CREATE INDEX idx_counterparties_deleted_at  ON counterparties(deleted_at)   WHERE deleted_at IS NULL;

CREATE TRIGGER trg_counterparties_touch
    BEFORE UPDATE ON counterparties
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Section 1.4 — Employee Master
-- One row per employee, scoped to an employing legal entity.
-- Sensitive payroll attributes (national_id, date_of_birth, tax_identifier,
-- compensation_band) are masked by default at the API layer and unmasked
-- only for users with the PAYROLL_PII_ACCESS permission (§15.2). The linked
-- employee bank account is a forward reference to the beneficiary master
-- (Section 6); changes to it flow through the controls in §5.4.
-- =====================================================================

CREATE TABLE employees (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Employee identifier supplied by HR (payroll number). Unique per
    -- employing entity so two entities can share a numbering scheme.
    employee_code            VARCHAR(40)  NOT NULL,
    full_name                VARCHAR(150) NOT NULL,
    preferred_name           VARCHAR(150),
    work_email               CITEXT,
    -- Employing legal entity (Section 1.1). Drives currency defaults,
    -- payroll batching, and entity-scoped visibility.
    legal_entity_id          UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    -- Country of employment (ISO 3166-1 alpha-2). May differ from the
    -- entity's registered country for cross-border employees.
    country_code             CHAR(2)      NOT NULL,
    -- Base currency in which the employee is paid.
    base_currency_id         UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    -- Payroll category determines workflow grouping (e.g. STAFF, EXEC,
    -- CONTRACTOR, INTERN). Free string, validated at the API layer
    -- against the configured catalogue.
    payroll_category         VARCHAR(40)  NOT NULL,
    -- Forward reference to the linked beneficiary bank account
    -- (beneficiary master, Section 6). Nullable so an employee record
    -- can exist before the bank account change request is completed.
    employee_bank_account_id UUID,
    employment_start_date    DATE,
    employment_end_date      DATE,
    -- Sensitive — masked by default.
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
    CONSTRAINT chk_employment_dates CHECK (
        employment_end_date IS NULL OR employment_end_date >= employment_start_date
    )
);
CREATE INDEX idx_employees_legal_entity  ON employees(legal_entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_country       ON employees(country_code)    WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_active        ON employees(is_active)       WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_deleted_at    ON employees(deleted_at)      WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_bank_account  ON employees(employee_bank_account_id);

CREATE TRIGGER trg_employees_touch
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Section 1.5 — Approval Matrix Configuration
-- A matrix belongs to a payment type (referenced by its stable code, not
-- the version UUID, because payment types are themselves versioned).
-- Bands are currency-native (no FX conversion of thresholds, per §2.1)
-- and map to a sequential chain of approvers. Matrices are themselves
-- versioned with effective dates; publishing a new version closes out
-- the previously-published one. Requests already in flight pin to the
-- matrix version that was effective at submission time — the resolver
-- service receives the as-of date to enforce this.
-- =====================================================================

CREATE TABLE approval_matrices (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(150) NOT NULL,
    description           TEXT,
    -- Stable payment-type code (e.g. VENDOR_PAYMENT). Decoupled from
    -- payment_types.id so a payment-type version change does not orphan
    -- the matrix.
    payment_type_code     VARCHAR(50)  NOT NULL,
    effective_from        DATE         NOT NULL,
    effective_to          DATE,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    tt_mode               VARCHAR(20)  NOT NULL DEFAULT 'ONLINE_TT',
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,
    created_by            UUID,
    updated_by            UUID,
    CONSTRAINT chk_approval_matrix_effective  CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_approval_matrix_tt_mode    CHECK (tt_mode IN ('ONLINE_TT','OFFLINE_TT')),
    CONSTRAINT uq_approval_matrix_pt_name      UNIQUE (payment_type_code, name)
);
CREATE INDEX idx_am_payment_type ON approval_matrices(payment_type_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_am_effective    ON approval_matrices(effective_from)    WHERE deleted_at IS NULL;
CREATE INDEX idx_am_deleted_at   ON approval_matrices(deleted_at)        WHERE deleted_at IS NULL;

-- Bands: currency-native thresholds within a matrix. Amounts in minor units
-- (e.g. paise / cents) to avoid float drift. max_amount_minor = NULL is the
-- open-ended top band. Non-overlap within (matrix, currency) is enforced by
-- the service layer at save time.
CREATE TABLE approval_matrix_bands (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matrix_id             UUID NOT NULL REFERENCES approval_matrices(id) ON DELETE CASCADE,
    currency_code         CHAR(3) NOT NULL,
    min_amount_minor      BIGINT  NOT NULL,
    max_amount_minor      BIGINT,
    sort_order            INT     NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_band_amounts CHECK (
        min_amount_minor >= 0
        AND (max_amount_minor IS NULL OR max_amount_minor >= min_amount_minor)
    ),
    CONSTRAINT uq_band_per_matrix_currency_min UNIQUE (matrix_id, currency_code, min_amount_minor)
);
CREATE INDEX idx_amb_matrix   ON approval_matrix_bands(matrix_id);
CREATE INDEX idx_amb_currency ON approval_matrix_bands(matrix_id, currency_code);

-- Sequential approver chain per band. Each step targets either a specific
-- user OR a role (resolved against user_entity_roles at runtime). step_order
-- is 1-based and must be contiguous; enforced at the service layer.
CREATE TABLE approval_matrix_steps (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id               UUID NOT NULL REFERENCES approval_matrix_bands(id) ON DELETE CASCADE,
    step_order            INT  NOT NULL,
    approver_type         VARCHAR(10) NOT NULL,
    approver_user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
    approver_role_id      UUID REFERENCES roles(id) ON DELETE RESTRICT,
    is_optional           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_step_type CHECK (approver_type IN ('USER','ROLE')),
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

CREATE TRIGGER trg_approval_matrices_touch
    BEFORE UPDATE ON approval_matrices
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_approval_matrix_bands_touch
    BEFORE UPDATE ON approval_matrix_bands
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_approval_matrix_steps_touch
    BEFORE UPDATE ON approval_matrix_steps
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Section 1.6 — Sanctioned-Country Master
-- Admin-maintained list of sanctioned country codes used to screen
-- beneficiaries (§6.5). The country_code is the natural key (ISO 3166-1
-- alpha-2). `reason` is the most-recent justification for inclusion and
-- is mandatory on every add/update/remove; the full history (user,
-- timestamp, before/after, reason) is preserved in `audit_logs`.
-- Soft-delete is used so removed entries remain auditable and the
-- screening service can reconstruct historical state.
-- =====================================================================

CREATE TABLE sanctioned_countries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code    CHAR(2)       NOT NULL,         -- ISO 3166-1 alpha-2
    country_name    VARCHAR(120)  NOT NULL,
    reason          TEXT          NOT NULL,         -- current reason for inclusion
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT chk_sanctioned_country_code CHECK (country_code ~ '^[A-Z]{2}$')
);

-- Only one *live* row per country code; removed rows (deleted_at IS NOT NULL)
-- are retained for audit and excluded from the uniqueness constraint.
CREATE UNIQUE INDEX uq_sanctioned_country_code_live
    ON sanctioned_countries(country_code)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_sanctioned_countries_active
    ON sanctioned_countries(is_active)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_sanctioned_countries_deleted_at
    ON sanctioned_countries(deleted_at)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_sanctioned_countries_touch
    BEFORE UPDATE ON sanctioned_countries
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Section 2.1 — Currency Master (extension)
-- The base `currencies` table is created above (used by §1.1 forward
-- references). Section 2.1 enriches it with ISO 4217 numeric code, minor
-- unit, display symbol, system flag (seeded rows cannot be deleted),
-- soft-delete, and acting-user audit columns — bringing it in line with
-- every other master in the system.
-- =====================================================================

ALTER TABLE currencies
    ADD COLUMN IF NOT EXISTS numeric_code  CHAR(3),
    ADD COLUMN IF NOT EXISTS minor_unit    SMALLINT NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS symbol        VARCHAR(8),
    ADD COLUMN IF NOT EXISTS is_system     BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by    UUID,
    ADD COLUMN IF NOT EXISTS updated_by    UUID;

DO $$ BEGIN
    ALTER TABLE currencies
        ADD CONSTRAINT chk_currency_code CHECK (code ~ '^[A-Z]{3}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_currencies_active     ON currencies(is_active);
CREATE INDEX IF NOT EXISTS idx_currencies_deleted_at ON currencies(deleted_at) WHERE deleted_at IS NULL;

-- Mark seeded currencies as system so they cannot be deleted via the API.
UPDATE currencies
   SET is_system = TRUE
 WHERE code IN ('USD','EUR','GBP','INR','AED','SGD','CNY')
   AND is_system = FALSE;

-- Enrich seeded rows with numeric code & minor unit (idempotent).
UPDATE currencies SET numeric_code = '840', minor_unit = 2, symbol = '$'   WHERE code = 'USD' AND numeric_code IS NULL;
UPDATE currencies SET numeric_code = '978', minor_unit = 2, symbol = '€'   WHERE code = 'EUR' AND numeric_code IS NULL;
UPDATE currencies SET numeric_code = '826', minor_unit = 2, symbol = '£'   WHERE code = 'GBP' AND numeric_code IS NULL;
UPDATE currencies SET numeric_code = '356', minor_unit = 2, symbol = '₹'   WHERE code = 'INR' AND numeric_code IS NULL;
UPDATE currencies SET numeric_code = '784', minor_unit = 2, symbol = 'د.إ' WHERE code = 'AED' AND numeric_code IS NULL;
UPDATE currencies SET numeric_code = '702', minor_unit = 2, symbol = 'S$'  WHERE code = 'SGD' AND numeric_code IS NULL;
UPDATE currencies SET numeric_code = '156', minor_unit = 2, symbol = '¥'   WHERE code = 'CNY' AND numeric_code IS NULL;

-- =====================================================================
-- Section 2.2 — Foreign Exchange Rates
-- Daily quotes fetched from OANDA Exchange Rates API (default provider),
-- abstracted behind FxRatesService.IRatesProvider so the source can be
-- substituted without rework. USD is the default base (group reporting
-- currency, §2.1). When the feed is unavailable the system holds the
-- previous day's rate (`source = STALE_HELD`); admins may override with
-- `source = MANUAL_OVERRIDE` and the reason is captured.
-- =====================================================================

CREATE TABLE fx_rates (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency_code    CHAR(3)        NOT NULL,
    quote_currency_code   CHAR(3)        NOT NULL,
    rate                  DECIMAL(20,10) NOT NULL,
    as_of_date            DATE           NOT NULL,
    source                VARCHAR(20)    NOT NULL,
    fetched_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
    provider_name         VARCHAR(50),
    override_reason       TEXT,
    created_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,
    created_by            UUID,
    updated_by            UUID,
    CONSTRAINT chk_fx_rate_positive CHECK (rate > 0),
    CONSTRAINT chk_fx_rate_source   CHECK (source IN ('OANDA','MANUAL_OVERRIDE','STALE_HELD')),
    CONSTRAINT chk_fx_rate_base     CHECK (base_currency_code  ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_fx_rate_quote    CHECK (quote_currency_code ~ '^[A-Z]{3}$'),
    CONSTRAINT uq_fx_rate_base_quote_asof UNIQUE (base_currency_code, quote_currency_code, as_of_date)
);
CREATE INDEX idx_fx_rates_quote_date ON fx_rates(quote_currency_code, as_of_date);
CREATE INDEX idx_fx_rates_asof       ON fx_rates(as_of_date);

CREATE TRIGGER trg_fx_rates_touch
    BEFORE UPDATE ON fx_rates
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Section 2.3 — Bank Master
-- Banks with which the group holds relationships. (name, country_code)
-- is unique within the live set so the same bank in two countries
-- carries its own SWIFT/BIC and address.
-- =====================================================================

CREATE TABLE banks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) NOT NULL,
    short_name    VARCHAR(50),
    country_code  CHAR(2)      NOT NULL,
    swift_bic     VARCHAR(11),
    address       TEXT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ,
    created_by    UUID,
    updated_by    UUID,
    CONSTRAINT chk_banks_country CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT chk_banks_swift   CHECK (swift_bic IS NULL OR swift_bic ~ '^[A-Z0-9]{8}([A-Z0-9]{3})?$'),
    CONSTRAINT uq_banks_name_country UNIQUE (name, country_code)
);
CREATE INDEX idx_banks_country    ON banks(country_code)        WHERE deleted_at IS NULL;
CREATE INDEX idx_banks_active     ON banks(is_active)           WHERE deleted_at IS NULL;
CREATE INDEX idx_banks_deleted_at ON banks(deleted_at)          WHERE deleted_at IS NULL;

CREATE TRIGGER trg_banks_touch
    BEFORE UPDATE ON banks
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Section 2.4 — Account Master
-- One row per group-owned bank account; (bank, account_number) is unique
-- among live rows. `account_type` discriminates behaviour:
--   CURRENT    : operational. Must carry minimum_balance; min-balance
--                control (§2.5) blocks any release that would push the
--                balance below it.
--   COLLATERAL : letter-of-credit only; never selectable for TT.
--   DEPOSIT    : term deposit, held for visibility only. Balance mutated
--                only by explicit admin override (interest accrual /
--                renewal / redemption); no workflow event touches it.
-- `is_chairman_designated` segregates the chairman-payment accounts
-- (§9.2) from the standard maker's source-account picker.
-- =====================================================================

CREATE TABLE bank_accounts (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname                 VARCHAR(120) NOT NULL,
    legal_entity_id          UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    bank_id                  UUID NOT NULL REFERENCES banks(id)          ON DELETE RESTRICT,
    currency_id              UUID NOT NULL REFERENCES currencies(id)     ON DELETE RESTRICT,
    account_number           VARCHAR(50)  NOT NULL,
    iban                     VARCHAR(34),
    account_type             VARCHAR(12)  NOT NULL,
    branch_name              VARCHAR(120),
    branch_code              VARCHAR(30),
    balance                  DECIMAL(20,4) NOT NULL DEFAULT 0,
    balance_as_of            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    balance_source           VARCHAR(30)   NOT NULL DEFAULT 'SEEDED',
    minimum_balance          DECIMAL(20,4),
    is_chairman_designated   BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID,
    CONSTRAINT chk_bank_account_type CHECK (account_type IN ('CURRENT','COLLATERAL','DEPOSIT')),
    CONSTRAINT chk_balance_source    CHECK (balance_source IN (
        'SEEDED','SYSTEM_COMPUTED','STATEMENT_RECONCILED','MANUAL_OVERRIDE'
    )),
    -- Minimum balance is mandatory for CURRENT and must be NULL for the
    -- non-operational account types. Enforced at the DB layer to keep the
    -- invariant true even if the API is bypassed.
    CONSTRAINT chk_bank_account_min_balance CHECK (
        (account_type = 'CURRENT'  AND minimum_balance IS NOT NULL)
     OR (account_type IN ('COLLATERAL','DEPOSIT') AND minimum_balance IS NULL)
    ),
    CONSTRAINT uq_bank_account_number_per_bank UNIQUE (bank_id, account_number)
);
CREATE INDEX idx_bank_accounts_entity     ON bank_accounts(legal_entity_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_bank       ON bank_accounts(bank_id)             WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_currency   ON bank_accounts(currency_id)         WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_type       ON bank_accounts(account_type)        WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_active     ON bank_accounts(is_active)           WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_deleted_at ON bank_accounts(deleted_at)          WHERE deleted_at IS NULL;

CREATE TRIGGER trg_bank_accounts_touch
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Section 2.5 — Balance Maintenance (append-only movement ledger)
-- Every change to an account's recorded balance is captured here, with
-- the kind, before/after values, signed delta, and originating reference
-- (payment_request_id, receipt_id, statement_upload_id — forward refs).
-- The audit_logs table holds the cross-system audit row; this table
-- exists for ergonomic per-account drill-down on the dashboard.
-- =====================================================================

CREATE TABLE balance_changes (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id             UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    kind                   VARCHAR(25) NOT NULL,
    previous_balance       DECIMAL(20,4) NOT NULL,
    new_balance            DECIMAL(20,4) NOT NULL,
    delta                  DECIMAL(20,4) NOT NULL,
    reason                 TEXT,
    payment_request_id     UUID,  -- forward ref (lifecycle module)
    receipt_id             UUID,  -- forward ref (§7)
    statement_upload_id    UUID,  -- forward ref (§8)
    changed_by             UUID,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_balance_change_kind CHECK (kind IN (
        'PAYMENT_DEBIT','RECEIPT_CREDIT','STATEMENT_RESET',
        'MANUAL_OVERRIDE','PAYMENT_CORRECTION'
    ))
);
CREATE INDEX idx_balance_changes_account_time ON balance_changes(account_id, created_at DESC);
CREATE INDEX idx_balance_changes_kind         ON balance_changes(kind);

-- =====================================================================
-- Section 3 — Payment Lifecycle
-- =====================================================================

-- Auto-incrementing sequence for human-readable request numbers.
CREATE SEQUENCE IF NOT EXISTS payment_request_seq START 1;

-- -----------------------------------------------------------------------
-- payment_requests
-- One row per payment request. status follows the canonical lifecycle:
--   DRAFT → PENDING_APPROVAL → APPROVED → AWAITING_PAYMENT_CONFIRMATION
--   → PAID  (terminal)
-- Any non-terminal status may also transition to REJECTED, WITHDRAWN, or
-- CANCELLED (admin).
-- -----------------------------------------------------------------------
CREATE TABLE payment_requests (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number              VARCHAR(30) NOT NULL UNIQUE,
    payment_type_code           VARCHAR(30) NOT NULL,
    counterparty_id             UUID        REFERENCES counterparties(id) ON DELETE RESTRICT,
    employee_id                 UUID        REFERENCES employees(id) ON DELETE RESTRICT,
    currency_code               CHAR(3)     NOT NULL,
    amount                      DECIMAL(20,4) NOT NULL,
    amount_minor                BIGINT      NOT NULL,
    purpose_description         TEXT,
    source_account_id           UUID        REFERENCES bank_accounts(id) ON DELETE RESTRICT,
    is_cross_currency           BOOLEAN     NOT NULL DEFAULT FALSE,
    indicative_source_amount    DECIMAL(20,4),
    bank_reference              VARCHAR(100),
    value_date                  DATE,
    proof_of_payment_url        VARCHAR(500),
    status                      VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    submitted_at                TIMESTAMPTZ,
    approved_at                 TIMESTAMPTZ,
    paid_at                     TIMESTAMPTZ,
    matrix_id                   UUID,
    current_step_order          INTEGER,
    -- Treasury Team execution (post final-approval)
    tt_mode                     VARCHAR(20),
    treasury_reference_number   VARCHAR(100),
    swift_copy_url              VARCHAR(500),
    treasury_maker_by           UUID,
    treasury_maker_at           TIMESTAMPTZ,
    treasury_checker_by         UUID,
    treasury_checker_at         TIMESTAMPTZ,
    treasury_authoriser_by      UUID,
    treasury_authoriser_at      TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,
    rejection_reason            TEXT,
    cancellation_reason         TEXT,
    maker_notes                 TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                  TIMESTAMPTZ,
    created_by                  UUID,
    updated_by                  UUID,
    CONSTRAINT chk_pr_status CHECK (status IN (
        'DRAFT','PENDING_APPROVAL',
        'TREASURY_MAKER','TREASURY_CHECKER','TREASURY_AUTHORISER','COMPLETED',
        'REJECTED','WITHDRAWN','CANCELLED'
    )),
    CONSTRAINT chk_pr_currency CHECK (currency_code ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_pr_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payment_requests_deleted    ON payment_requests(deleted_at)        WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_requests_status     ON payment_requests(status)            WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_requests_type       ON payment_requests(payment_type_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_requests_cp         ON payment_requests(counterparty_id)   WHERE counterparty_id IS NOT NULL;
CREATE INDEX idx_payment_requests_emp        ON payment_requests(employee_id)       WHERE employee_id IS NOT NULL;
CREATE INDEX idx_payment_requests_created    ON payment_requests(created_at DESC)   WHERE deleted_at IS NULL;

CREATE TRIGGER trg_payment_requests_touch
    BEFORE UPDATE ON payment_requests
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- -----------------------------------------------------------------------
-- payment_request_approvals
-- One row per approval step per request, created when the request is
-- submitted. Rows are never deleted; the decision column tracks the
-- outcome of each step.
-- -----------------------------------------------------------------------
CREATE TABLE payment_request_approvals (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id   UUID        NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    step_order           INTEGER     NOT NULL,
    approver_type        VARCHAR(10) NOT NULL,
    approver_user_id     UUID,
    approver_role_id     UUID,
    is_optional          BOOLEAN     NOT NULL DEFAULT FALSE,
    decision             VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    decided_by           UUID,
    decided_at           TIMESTAMPTZ,
    comments             TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pra_approver_type CHECK (approver_type IN ('USER','ROLE')),
    CONSTRAINT chk_pra_decision      CHECK (decision IN ('PENDING','APPROVED','REJECTED'))
);

CREATE INDEX idx_pra_request  ON payment_request_approvals(payment_request_id);
CREATE INDEX idx_pra_user     ON payment_request_approvals(approver_user_id) WHERE approver_user_id IS NOT NULL;
CREATE INDEX idx_pra_role     ON payment_request_approvals(approver_role_id) WHERE approver_role_id IS NOT NULL;
CREATE INDEX idx_pra_decision ON payment_request_approvals(decision);

-- -----------------------------------------------------------------------
-- payment_request_documents
-- Supporting documents attached to a payment request. Stores metadata
-- only; actual file bytes live in the configured object store.
-- -----------------------------------------------------------------------
CREATE TABLE payment_request_documents (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id   UUID         NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    document_code        VARCHAR(50)  NOT NULL,
    document_label       VARCHAR(200),
    file_name            VARCHAR(255) NOT NULL,
    file_url             VARCHAR(500) NOT NULL,
    file_size_bytes      INTEGER,
    mime_type            VARCHAR(100),
    uploaded_by          UUID,
    uploaded_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- =====================================================================
-- Section 5 — Payroll Batches
-- =====================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_batch_status') THEN
    CREATE TYPE payroll_batch_status AS ENUM (
      'VALIDATION_FAILED','DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED'
    );
  END IF;
END $$;

CREATE SEQUENCE IF NOT EXISTS payroll_batch_seq START 1;

CREATE TABLE IF NOT EXISTS payroll_batches (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number         TEXT NOT NULL UNIQUE,
    legal_entity_id      UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
    period_label         TEXT NOT NULL,
    currency_code        CHAR(3) NOT NULL,
    total_gross_minor    BIGINT NOT NULL DEFAULT 0,
    total_net_minor      BIGINT NOT NULL DEFAULT 0,
    employee_count       INT NOT NULL DEFAULT 0,
    variance_flag        BOOLEAN NOT NULL DEFAULT FALSE,
    headcount_delta      INT,
    sanity_notes         TEXT,
    status               payroll_batch_status NOT NULL DEFAULT 'DRAFT',
    file_url             TEXT NOT NULL,
    uploaded_by          UUID REFERENCES users(id),
    submitted_at         TIMESTAMPTZ,
    approved_by          UUID REFERENCES users(id),
    approved_at          TIMESTAMPTZ,
    rejected_by          UUID REFERENCES users(id),
    rejected_at          TIMESTAMPTZ,
    rejection_reason     TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ,
    created_by           UUID,
    updated_by           UUID
);

CREATE TABLE IF NOT EXISTS payroll_batch_items (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id                 UUID NOT NULL REFERENCES payroll_batches(id) ON DELETE CASCADE,
    employee_id              UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    beneficiary_account_id   UUID REFERENCES beneficiary_accounts(id),
    gross_amount_minor       BIGINT NOT NULL,
    net_amount_minor         BIGINT NOT NULL,
    deductions_minor         BIGINT NOT NULL DEFAULT 0,
    payslip_url              TEXT,
    variance_flag            BOOLEAN NOT NULL DEFAULT FALSE,
    previous_net_minor       BIGINT,
    variance_pct             NUMERIC(6,2),
    payment_request_id       UUID REFERENCES payment_requests(id),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- Section 5 — Employee Bank Account Change Control
-- =====================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ebac_change_type') THEN
    CREATE TYPE ebac_change_type AS ENUM ('ADD','MODIFY','DEACTIVATE');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ebac_status') THEN
    CREATE TYPE ebac_status AS ENUM (
      'PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','CANCELLED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS employee_bank_account_changes (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id          UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    change_type          ebac_change_type NOT NULL,
    status               ebac_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    proposed_data        JSONB NOT NULL DEFAULT '{}',
    documents            JSONB NOT NULL DEFAULT '[]',
    anomaly_flag         BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_notes        TEXT,
    requested_by         UUID NOT NULL REFERENCES users(id),
    verified_by          UUID REFERENCES users(id),
    verified_at          TIMESTAMPTZ,
    verification_notes   TEXT,
    callback_evidence    TEXT,
    approved_by          UUID REFERENCES users(id),
    approved_at          TIMESTAMPTZ,
    rejected_by          UUID REFERENCES users(id),
    rejected_at          TIMESTAMPTZ,
    rejection_reason     TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ,
    created_by           UUID,
    updated_by           UUID,
    CONSTRAINT ebac_maker_checker CHECK (verified_by IS NULL OR verified_by <> requested_by)
);

CREATE INDEX idx_prd_request ON payment_request_documents(payment_request_id);
