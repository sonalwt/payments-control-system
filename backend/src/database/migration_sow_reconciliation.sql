-- =====================================================================
-- Payments Control System — SOW Section 8
-- Bank Statement Reconciliation and Exception Management
-- =====================================================================
-- Because the system does not execute payments, this control detects any
-- movement on a group bank account without a corresponding record. On
-- upload the account's recorded balance is reset to the statement closing
-- balance (§2.5 / §8.1). The auto-matcher pairs debit lines with COMPLETED
-- outgoing payments and credit lines with RECEIVED incoming receipts; every
-- unmatched line escalates to a reconciliation exception (§8.2 / §8.3).
-- =====================================================================

-- Human-readable exception numbers: EXC-YYYY-00001
CREATE SEQUENCE IF NOT EXISTS reconciliation_exception_seq START 1;

-- -----------------------------------------------------------------------
-- bank_statement_uploads — one row per uploaded statement file (§8.1)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_statement_uploads (
    id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id          UUID          NOT NULL REFERENCES bank_accounts(id),
    statement_date           DATE          NOT NULL,
    opening_balance          NUMERIC(20,4) NOT NULL,
    closing_balance          NUMERIC(20,4) NOT NULL,
    file_url                 VARCHAR(500)  NOT NULL,
    row_count                INTEGER       NOT NULL DEFAULT 0,
    notes                    TEXT,
    -- Ingestion / reconciliation lifecycle
    ingestion_status         VARCHAR(20)   NOT NULL DEFAULT 'UPLOADED',
    ingestion_format         VARCHAR(10),
    ingestion_error          TEXT,
    auto_match_completed_at  TIMESTAMPTZ,
    matched_count            INTEGER       NOT NULL DEFAULT 0,
    candidate_count          INTEGER       NOT NULL DEFAULT 0,
    exception_count          INTEGER       NOT NULL DEFAULT 0,
    uploaded_by              UUID,
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at               TIMESTAMPTZ,
    CONSTRAINT chk_statement_ingestion_status CHECK (ingestion_status IN (
        'UPLOADED','PARSED','PARSE_FAILED','MATCHED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_statement_uploads_account
    ON bank_statement_uploads(bank_account_id, statement_date DESC);

-- -----------------------------------------------------------------------
-- bank_statement_lines — one row per parsed statement entry (§8.2)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_statement_lines (
    id                          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_upload_id         UUID          NOT NULL REFERENCES bank_statement_uploads(id) ON DELETE CASCADE,
    bank_account_id             UUID          NOT NULL REFERENCES bank_accounts(id),
    line_index                  INTEGER       NOT NULL,
    value_date                  DATE          NOT NULL,
    posting_date                DATE,
    direction                   VARCHAR(10)   NOT NULL,
    amount                      NUMERIC(20,4) NOT NULL,
    currency_code               VARCHAR(10)   NOT NULL,
    bank_reference              VARCHAR(140),
    counterparty_text           VARCHAR(300),
    narrative                   TEXT,
    running_balance             NUMERIC(20,4),
    match_status                VARCHAR(15)   NOT NULL DEFAULT 'UNMATCHED',
    matched_payment_request_id  UUID          REFERENCES payment_requests(id),
    matched_incoming_receipt_id UUID          REFERENCES incoming_receipts(id),
    match_score                 NUMERIC(5,2),
    match_reason                TEXT,
    matched_at                  TIMESTAMPTZ,
    matched_by                  UUID,
    exception_id                UUID,
    created_at                  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_statement_line_direction CHECK (direction IN ('DEBIT','CREDIT')),
    CONSTRAINT chk_statement_line_match CHECK (match_status IN (
        'UNMATCHED','CANDIDATE','MATCHED','EXCEPTION'
    ))
);

CREATE INDEX IF NOT EXISTS idx_statement_lines_upload
    ON bank_statement_lines(statement_upload_id, line_index);
CREATE INDEX IF NOT EXISTS idx_statement_lines_match
    ON bank_statement_lines(match_status);

-- -----------------------------------------------------------------------
-- reconciliation_exceptions — unmatched lines escalated for review (§8.3)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reconciliation_exceptions (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_number    VARCHAR(30)   NOT NULL UNIQUE,
    statement_upload_id UUID          NOT NULL REFERENCES bank_statement_uploads(id) ON DELETE CASCADE,
    statement_line_id   UUID          NOT NULL REFERENCES bank_statement_lines(id) ON DELETE CASCADE,
    bank_account_id     UUID          NOT NULL REFERENCES bank_accounts(id),
    exception_type      VARCHAR(25)   NOT NULL,
    status              VARCHAR(30)   NOT NULL DEFAULT 'OPEN',
    amount              NUMERIC(20,4) NOT NULL,
    currency_code       VARCHAR(10)   NOT NULL,
    value_date          DATE          NOT NULL,
    bank_reference      VARCHAR(140),
    counterparty_text   VARCHAR(300),
    narrative           TEXT,
    resolution_note     TEXT,
    investigated_by     UUID,
    investigated_at     TIMESTAMPTZ,
    resolved_by         UUID,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_recon_exception_type CHECK (exception_type IN (
        'UNAUTHORISED_PAYMENT','UNIDENTIFIED_RECEIPT'
    )),
    CONSTRAINT chk_recon_exception_status CHECK (status IN (
        'OPEN','UNDER_INVESTIGATION','RESOLVED_WITH_JUSTIFICATION','CONFIRMED_EXCEPTION'
    ))
);

CREATE INDEX IF NOT EXISTS idx_recon_exceptions_status
    ON reconciliation_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_recon_exceptions_upload
    ON reconciliation_exceptions(statement_upload_id);
CREATE INDEX IF NOT EXISTS idx_recon_exceptions_type
    ON reconciliation_exceptions(exception_type);
