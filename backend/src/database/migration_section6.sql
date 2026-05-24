-- =====================================================================
-- Payments Control System — Section 6
-- Beneficiary Master & Bank Account Change Control
-- =====================================================================

-- -----------------------------------------------------------------------
-- 6.1  beneficiary_accounts
-- One row per verified destination bank account. Belongs to either a
-- counterparty OR an employee (XOR enforced by CHECK constraint).
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiary_accounts (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Owner: exactly one of the two FKs must be non-NULL.
    counterparty_id       UUID        REFERENCES counterparties(id) ON DELETE RESTRICT,
    employee_id           UUID        REFERENCES employees(id)      ON DELETE RESTRICT,
    account_holder_name   VARCHAR(200) NOT NULL,
    account_number        VARCHAR(60)  NOT NULL,
    bank_id               UUID        NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
    -- Denormalised for quick display without joining banks every time.
    bank_name             VARCHAR(150),
    branch_name           VARCHAR(120),
    swift_bic             VARCHAR(11),
    iban                  VARCHAR(34),
    currency_id           UUID        NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    country_code          CHAR(2)     NOT NULL,
    -- PENDING_ACTIVATION: approved, cooling-off window not yet elapsed.
    -- ACTIVE:             usable for payment.
    -- INACTIVE:           deactivated by change request or admin override.
    status                VARCHAR(25) NOT NULL DEFAULT 'PENDING_ACTIVATION',
    cooling_off_until     TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,
    created_by            UUID,
    updated_by            UUID,
    CONSTRAINT chk_bene_owner CHECK (
        (counterparty_id IS NOT NULL AND employee_id IS NULL)
        OR
        (counterparty_id IS NULL AND employee_id IS NOT NULL)
    ),
    CONSTRAINT chk_bene_status CHECK (
        status IN ('PENDING_ACTIVATION', 'ACTIVE', 'INACTIVE')
    ),
    CONSTRAINT chk_bene_country CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT uq_bene_account_bank UNIQUE (bank_id, account_number)
);

CREATE INDEX IF NOT EXISTS idx_bene_counterparty ON beneficiary_accounts(counterparty_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_employee     ON beneficiary_accounts(employee_id)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_status       ON beneficiary_accounts(status)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_country      ON beneficiary_accounts(country_code)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_deleted_at   ON beneficiary_accounts(deleted_at)      WHERE deleted_at IS NULL;

CREATE OR REPLACE TRIGGER trg_beneficiary_accounts_touch
    BEFORE UPDATE ON beneficiary_accounts
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- -----------------------------------------------------------------------
-- 6.2  beneficiary_account_change_requests
-- Every add / modify / deactivate goes through this workflow.
-- Maker-checker: verified_by ≠ requested_by.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiary_account_change_requests (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- For MODIFY / DEACTIVATE, references existing account.
    -- For ADD, NULL until the account is created on approval.
    beneficiary_account_id    UUID        REFERENCES beneficiary_accounts(id) ON DELETE RESTRICT,
    change_type               VARCHAR(12) NOT NULL,
    status                    VARCHAR(25) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    -- All proposed field values stored here; avoids repeating every account column.
    -- For ADD: full new-account data.
    -- For MODIFY: only changed fields.
    -- For DEACTIVATE: empty object.
    proposed_data             JSONB       NOT NULL DEFAULT '{}'::jsonb,
    -- Array of { documentCode, fileName, fileUrl, mimeType }
    documents                 JSONB       NOT NULL DEFAULT '[]'::jsonb,
    requested_by              UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    -- Checker fields (maker-checker §6.2)
    verified_by               UUID        REFERENCES users(id) ON DELETE RESTRICT,
    verified_at               TIMESTAMPTZ,
    verification_notes        TEXT,
    -- Evidence of independent callback verification (§6.2)
    callback_evidence         TEXT,
    -- Approver fields
    approved_by               UUID        REFERENCES users(id) ON DELETE RESTRICT,
    approved_at               TIMESTAMPTZ,
    -- Rejection
    rejected_by               UUID        REFERENCES users(id) ON DELETE RESTRICT,
    rejected_at               TIMESTAMPTZ,
    rejection_reason          TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                TIMESTAMPTZ,
    created_by                UUID,
    updated_by                UUID,
    CONSTRAINT chk_bacr_type   CHECK (change_type IN ('ADD', 'MODIFY', 'DEACTIVATE')),
    CONSTRAINT chk_bacr_status CHECK (status IN (
        'PENDING_VERIFICATION', 'VERIFIED', 'APPROVED', 'REJECTED', 'CANCELLED'
    )),
    -- Maker-checker: verifier cannot be the requester.
    CONSTRAINT chk_bacr_maker_checker CHECK (
        verified_by IS NULL OR verified_by <> requested_by
    )
);

CREATE INDEX IF NOT EXISTS idx_bacr_bene    ON beneficiary_account_change_requests(beneficiary_account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bacr_status  ON beneficiary_account_change_requests(status)                 WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bacr_reqby   ON beneficiary_account_change_requests(requested_by)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bacr_deleted ON beneficiary_account_change_requests(deleted_at)             WHERE deleted_at IS NULL;

CREATE OR REPLACE TRIGGER trg_bacr_touch
    BEFORE UPDATE ON beneficiary_account_change_requests
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- -----------------------------------------------------------------------
-- 6.3  Add beneficiary_account_id to payment_requests
-- -----------------------------------------------------------------------
ALTER TABLE payment_requests
    ADD COLUMN IF NOT EXISTS beneficiary_account_id UUID
        REFERENCES beneficiary_accounts(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_payment_requests_bene
    ON payment_requests(beneficiary_account_id)
    WHERE beneficiary_account_id IS NOT NULL;

-- -----------------------------------------------------------------------
-- Back-fill employee_bank_account_id FK now that the table exists
-- -----------------------------------------------------------------------
DO $$ BEGIN
    ALTER TABLE employees
        ADD CONSTRAINT fk_employee_bene_account
        FOREIGN KEY (employee_bank_account_id)
        REFERENCES beneficiary_accounts(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
