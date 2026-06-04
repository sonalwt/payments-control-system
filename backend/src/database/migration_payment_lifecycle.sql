-- =====================================================================
-- Payments Control System — SoW §3 / §4 / §6
-- Payment lifecycle, vendor payments, beneficiary master, change control
--
-- Tables created:
--   beneficiary_accounts                — §6.1 Beneficiary Master
--   beneficiary_account_change_requests — §6.2 Change Request Workflow
--   payment_requests                    — §3  Lifecycle (vendor-focused)
--   payment_request_approvals           — §3  Approval chain (snapshotted)
--   payment_request_documents           — §4.1 Attachments
--
-- Plus:
--   payment_request_seq sequence (request_number generator)
--
-- Idempotent.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- §6.1 Beneficiary Accounts master
-- Owned by either a counterparty (vendor/customer) OR an employee — never
-- both. Status governs whether the account is selectable on a payment.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiary_accounts (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counterparty_id       UUID REFERENCES counterparties(id) ON DELETE RESTRICT,
    employee_id           UUID REFERENCES employees(id)      ON DELETE RESTRICT,
    account_holder_name   VARCHAR(200) NOT NULL,
    account_number        VARCHAR(60)  NOT NULL,
    bank_id               UUID NOT NULL REFERENCES banks(id)       ON DELETE RESTRICT,
    branch_name           VARCHAR(120),
    swift_bic             VARCHAR(11),
    iban                  VARCHAR(34),
    currency_id           UUID NOT NULL REFERENCES currencies(id)  ON DELETE RESTRICT,
    country_id            UUID NOT NULL REFERENCES countries(id)   ON DELETE RESTRICT,
    account_direction     VARCHAR(15) NOT NULL DEFAULT 'PAY_TO',
    status                VARCHAR(25) NOT NULL DEFAULT 'PENDING_ACTIVATION',
    cooling_off_until     TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,
    created_by            UUID,
    updated_by            UUID,
    CONSTRAINT chk_bene_owner CHECK (
        (counterparty_id IS NOT NULL AND employee_id IS NULL)
     OR (counterparty_id IS NULL AND employee_id IS NOT NULL)
    ),
    CONSTRAINT chk_bene_status    CHECK (status IN ('PENDING_ACTIVATION','ACTIVE','INACTIVE')),
    CONSTRAINT chk_bene_direction CHECK (account_direction IN ('PAY_TO','RECEIVE_FROM','BOTH'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bene_bank_account_live
    ON beneficiary_accounts(bank_id, account_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_counterparty ON beneficiary_accounts(counterparty_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_employee     ON beneficiary_accounts(employee_id)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_status       ON beneficiary_accounts(status)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_country      ON beneficiary_accounts(country_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bene_deleted_at   ON beneficiary_accounts(deleted_at)      WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- §6.2 Bank Account Change Request workflow (maker-checker + final)
-- The user creating the change request CANNOT be the verifier. Final
-- approval pushes the underlying account to PENDING_ACTIVATION with a
-- cooling-off window before it becomes ACTIVE.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiary_account_change_requests (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_account_id   UUID REFERENCES beneficiary_accounts(id) ON DELETE RESTRICT,
    change_type              VARCHAR(12) NOT NULL,
    proposed_data            JSONB       NOT NULL DEFAULT '{}'::jsonb,
    documents                JSONB       NOT NULL DEFAULT '[]'::jsonb,
    status                   VARCHAR(25) NOT NULL DEFAULT 'PENDING_VERIFICATION',

    requested_by             UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requested_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    verified_by              UUID        REFERENCES users(id) ON DELETE RESTRICT,
    verified_at              TIMESTAMPTZ,
    verification_notes       TEXT,
    callback_evidence        TEXT,

    approved_by              UUID        REFERENCES users(id) ON DELETE RESTRICT,
    approved_at              TIMESTAMPTZ,

    rejected_by              UUID        REFERENCES users(id) ON DELETE RESTRICT,
    rejected_at              TIMESTAMPTZ,
    rejection_reason         TEXT,

    cooling_off_override     BOOLEAN     NOT NULL DEFAULT FALSE,
    cooling_off_override_reason TEXT,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    created_by               UUID,
    updated_by               UUID,
    CONSTRAINT chk_bacr_change_type CHECK (change_type IN ('ADD','MODIFY','DEACTIVATE')),
    CONSTRAINT chk_bacr_status      CHECK (status IN (
        'PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','CANCELLED'
    )),
    -- §6.2 maker-checker: the user who raised it cannot also verify it.
    CONSTRAINT chk_bacr_maker_checker CHECK (
        verified_by IS NULL OR verified_by <> requested_by
    )
);

CREATE INDEX IF NOT EXISTS idx_bacr_bene_account ON beneficiary_account_change_requests(beneficiary_account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bacr_status       ON beneficiary_account_change_requests(status)                 WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bacr_requested_by ON beneficiary_account_change_requests(requested_by)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bacr_deleted_at   ON beneficiary_account_change_requests(deleted_at)             WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- §3 Payment Requests — canonical lifecycle.
-- Vendor payment fields per §4.1. Matrix is snapshot-pinned at submit
-- so in-flight requests survive later matrix edits unchanged (§1.5).
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS payment_request_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS payment_requests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number          VARCHAR(30) NOT NULL UNIQUE,

    payment_type_id         UUID NOT NULL REFERENCES payment_types(id)   ON DELETE RESTRICT,
    legal_entity_id         UUID NOT NULL REFERENCES legal_entities(id)  ON DELETE RESTRICT,
    counterparty_id         UUID REFERENCES counterparties(id)           ON DELETE RESTRICT,
    employee_id             UUID REFERENCES employees(id)                ON DELETE RESTRICT,
    beneficiary_account_id  UUID REFERENCES beneficiary_accounts(id)     ON DELETE RESTRICT,
    source_account_id       UUID REFERENCES bank_accounts(id)            ON DELETE RESTRICT,
    currency_id             UUID NOT NULL REFERENCES currencies(id)      ON DELETE RESTRICT,

    amount                  DECIMAL(20,4) NOT NULL,
    purpose_description     TEXT,

    -- §4.1 vendor-specific
    invoice_number          VARCHAR(60),
    due_date                DATE,

    -- §3 status machine (MVP — no chairman states)
    status                  VARCHAR(40) NOT NULL DEFAULT 'DRAFT',

    -- Lifecycle timestamps
    submitted_at            TIMESTAMPTZ,
    approved_at             TIMESTAMPTZ,
    released_at             TIMESTAMPTZ,
    paid_at                 TIMESTAMPTZ,

    -- §1.5 matrix snapshot pinned at submit
    matrix_id               UUID,
    current_step_order      INTEGER,

    -- §4.4 post-approval execution metadata
    bank_reference          VARCHAR(100),
    value_date              DATE,
    proof_of_payment_url    VARCHAR(500),

    -- Treasury Team execution (post final-approval)
    tt_mode                   VARCHAR(20),
    treasury_reference_number VARCHAR(100),
    swift_copy_url            VARCHAR(500),
    treasury_maker_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    treasury_maker_at         TIMESTAMPTZ,
    treasury_checker_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    treasury_checker_at       TIMESTAMPTZ,
    treasury_authoriser_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    treasury_authoriser_at    TIMESTAMPTZ,
    completed_at              TIMESTAMPTZ,

    -- §6.5 sanctioned-country screening result frozen at submit
    sanction_warning        BOOLEAN NOT NULL DEFAULT FALSE,
    sanction_override_reason TEXT,

    -- §1.3/§4.2 immutable snapshots frozen at submit
    counterparty_snapshot   JSONB,
    beneficiary_snapshot    JSONB,

    -- Reasons
    rejection_reason        TEXT,
    cancellation_reason     TEXT,
    withdrawn_reason        TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,
    created_by              UUID,
    updated_by              UUID,
    CONSTRAINT chk_pr_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_pr_status CHECK (status IN (
        'DRAFT','PENDING_APPROVAL',
        'TREASURY_MAKER','TREASURY_CHECKER','TREASURY_AUTHORISER','COMPLETED',
        'REJECTED','WITHDRAWN','CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_pr_status        ON payment_requests(status)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_entity        ON payment_requests(legal_entity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_counterparty  ON payment_requests(counterparty_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_payment_type  ON payment_requests(payment_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_created_at    ON payment_requests(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_invoice       ON payment_requests(invoice_number)  WHERE invoice_number IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_beneficiary   ON payment_requests(beneficiary_account_id) WHERE beneficiary_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pr_deleted_at    ON payment_requests(deleted_at)     WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- §3 Approval chain — snapshotted from the matrix at submission.
-- Each row is one step in the chain. Step ordering is dense and starts
-- at 1. step_order == payment_requests.current_step_order identifies
-- the active step.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_request_approvals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id  UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    step_order          INTEGER NOT NULL,
    approver_type       VARCHAR(10) NOT NULL,
    approver_user_id    UUID REFERENCES users(id) ON DELETE RESTRICT,
    approver_role_id    UUID REFERENCES roles(id) ON DELETE RESTRICT,
    decision            VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    decided_by          UUID REFERENCES users(id) ON DELETE RESTRICT,
    decided_at          TIMESTAMPTZ,
    comments            TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pra_type     CHECK (approver_type IN ('USER','ROLE')),
    CONSTRAINT chk_pra_decision CHECK (decision IN ('PENDING','APPROVED','REJECTED')),
    CONSTRAINT chk_pra_target CHECK (
        (approver_type = 'USER' AND approver_user_id IS NOT NULL AND approver_role_id IS NULL)
     OR (approver_type = 'ROLE' AND approver_role_id IS NOT NULL AND approver_user_id IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pra_request_step
    ON payment_request_approvals(payment_request_id, step_order);
CREATE INDEX IF NOT EXISTS idx_pra_user
    ON payment_request_approvals(approver_user_id) WHERE approver_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pra_role
    ON payment_request_approvals(approver_role_id) WHERE approver_role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pra_decision
    ON payment_request_approvals(decision);

-- ---------------------------------------------------------------------
-- §4.1 Attachments per payment request.
-- document_code matches the payment type's document_policy entry; the
-- service layer is responsible for enforcing the required set on submit.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_request_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id  UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    document_code       VARCHAR(50)  NOT NULL,
    document_label      VARCHAR(200),
    file_name           VARCHAR(255) NOT NULL,
    file_url            VARCHAR(500) NOT NULL,
    file_size_bytes     INTEGER,
    mime_type           VARCHAR(100),
    uploaded_by         UUID REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prd_request ON payment_request_documents(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_prd_code    ON payment_request_documents(payment_request_id, document_code);

COMMIT;
