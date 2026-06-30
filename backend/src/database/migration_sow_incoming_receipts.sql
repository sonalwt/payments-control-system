-- =====================================================================
-- Payments Control System — SOW Section 7
-- Incoming Receipts
-- =====================================================================
-- Inbound counterpart of outgoing payments. Records amounts the group
-- expects to receive from counterparties and confirms them against bank
-- credits. Incoming receipts do NOT pass through an approval chain (§7.2);
-- the payments (accounts) team reviews documents and marks the credit
-- received, which credits the receiving account's recorded balance (§7.3).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Prerequisite: balance_changes audit trail (§2.5).
-- Canonically defined in schema.sql; re-declared here (IF NOT EXISTS) so the
-- §7 receipt-credit and §8 statement-reset flows can rely on it even on
-- databases provisioned from migrations alone.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS balance_changes (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id             UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    kind                   VARCHAR(25) NOT NULL,
    previous_balance       DECIMAL(20,4) NOT NULL,
    new_balance            DECIMAL(20,4) NOT NULL,
    delta                  DECIMAL(20,4) NOT NULL,
    reason                 TEXT,
    payment_request_id     UUID,
    receipt_id             UUID,
    statement_upload_id    UUID,
    changed_by             UUID,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_balance_change_kind CHECK (kind IN (
        'PAYMENT_DEBIT','RECEIPT_CREDIT','STATEMENT_RESET',
        'MANUAL_OVERRIDE','PAYMENT_CORRECTION'
    ))
);
CREATE INDEX IF NOT EXISTS idx_balance_changes_account_time ON balance_changes(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_changes_kind ON balance_changes(kind);

-- Human-readable receipt numbers: IR-YYYY-00001
CREATE SEQUENCE IF NOT EXISTS incoming_receipt_seq START 1;

CREATE TABLE IF NOT EXISTS incoming_receipts (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number          VARCHAR(30)  NOT NULL UNIQUE,
    legal_entity_id         UUID         NOT NULL REFERENCES legal_entities(id),
    counterparty_id         UUID         NOT NULL REFERENCES counterparties(id),
    -- The group's own bank account expected to receive the credit.
    receive_from_account_id UUID         NOT NULL REFERENCES bank_accounts(id),
    expected_amount         NUMERIC(20,4) NOT NULL,
    expected_currency_code  VARCHAR(10)  NOT NULL,
    purpose_description     TEXT,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    submitted_at            TIMESTAMPTZ,
    -- Credit-received capture (§7.3)
    received_at             TIMESTAMPTZ,
    received_amount         NUMERIC(20,4),
    received_currency_code  VARCHAR(10),
    inward_bank_reference   VARCHAR(140),
    received_remarks        TEXT,
    cancellation_reason     TEXT,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at             TIMESTAMPTZ,
    created_by             UUID,
    updated_by             UUID,
    CONSTRAINT chk_incoming_receipt_status CHECK (status IN (
        'DRAFT','AWAITING_RECEIPT','RECEIVED','CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_incoming_receipts_status
    ON incoming_receipts(status);
CREATE INDEX IF NOT EXISTS idx_incoming_receipts_counterparty
    ON incoming_receipts(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_incoming_receipts_account
    ON incoming_receipts(receive_from_account_id);

CREATE TABLE IF NOT EXISTS incoming_receipt_documents (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    incoming_receipt_id UUID         NOT NULL REFERENCES incoming_receipts(id) ON DELETE CASCADE,
    document_code       VARCHAR(50)  NOT NULL,
    document_label      VARCHAR(200),
    file_name           VARCHAR(255) NOT NULL,
    file_url            VARCHAR(500) NOT NULL,
    file_size_bytes     INTEGER,
    mime_type           VARCHAR(100),
    uploaded_by         UUID,
    uploaded_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incoming_receipt_documents_receipt
    ON incoming_receipt_documents(incoming_receipt_id);
