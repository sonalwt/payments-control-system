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
    -- Document-attachment policy: array of
    --   { code, label, required, amountThresholdMinor?, currencyCode? }
    document_policy           JSONB NOT NULL DEFAULT '[]'::jsonb,
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
    document_policy, field_config, is_system
) VALUES
    ('VENDOR_PAYMENT',  'Vendor Payment',
        'Outgoing supplier-invoice settlement.', 'OUTGOING',
        TRUE, FALSE, FALSE, FALSE, TRUE,
        '[
            {"code":"INVOICE_PDF","label":"Invoice PDF","required":true},
            {"code":"PURCHASE_ORDER","label":"Purchase Order","required":false},
            {"code":"GRN","label":"Goods Receipt Note / Service Acceptance","required":false},
            {"code":"COUNTERPARTY_SNAPSHOT","label":"Counterparty Master Snapshot","required":true}
         ]'::jsonb,
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
            {"code":"PAYSLIP","label":"Payslip (per employee)","required":true},
            {"code":"PAYROLL_REGISTER","label":"Payroll Register","required":true}
         ]'::jsonb,
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
            {"code":"CLAIM_FORM","label":"Reimbursement Claim Form","required":true},
            {"code":"RECEIPTS","label":"Supporting Receipts","required":true}
         ]'::jsonb,
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
            {"code":"SETTLEMENT_LETTER","label":"Settlement Letter","required":true},
            {"code":"FNF_COMPUTATION","label":"FnF Computation Sheet","required":true}
         ]'::jsonb,
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
            {"code":"DEBIT_NOTE","label":"Debit Note / Final Invoice","required":true}
         ]'::jsonb,
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
            {"code":"AUTHORISATION_NOTE","label":"Chairman Authorisation Note","required":true}
         ]'::jsonb,
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
    version               INT          NOT NULL,
    -- DRAFT: editable, not used for resolution.
    -- PUBLISHED: immutable, used for resolution within its effective window.
    -- SUPERSEDED: closed out by a newer published version.
    status                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    effective_from        DATE         NOT NULL,
    effective_to          DATE,
    published_at          TIMESTAMPTZ,
    published_by          UUID,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,
    created_by            UUID,
    updated_by            UUID,
    CONSTRAINT chk_approval_matrix_status     CHECK (status IN ('DRAFT','PUBLISHED','SUPERSEDED')),
    CONSTRAINT chk_approval_matrix_effective  CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT uq_approval_matrix_pt_version  UNIQUE (payment_type_code, version)
);
CREATE INDEX idx_am_payment_type ON approval_matrices(payment_type_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_am_status       ON approval_matrices(status)            WHERE deleted_at IS NULL;
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
