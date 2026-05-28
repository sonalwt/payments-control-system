-- =====================================================================
-- Payments Control System — Section 1.2 Payment Type Master
-- Configurable catalogue of payment types. Each type carries its own
-- workflow behaviour flags, default document policy, and field-level
-- configuration. Idempotent.
-- =====================================================================

CREATE TABLE IF NOT EXISTS payment_types (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(40)  NOT NULL,
    name                    VARCHAR(100) NOT NULL,
    description             TEXT,
    direction               VARCHAR(10)  NOT NULL,
    requires_approval_chain BOOLEAN      NOT NULL DEFAULT TRUE,
    is_batch_based          BOOLEAN      NOT NULL DEFAULT FALSE,
    is_confidential         BOOLEAN      NOT NULL DEFAULT FALSE,
    mobile_initiation_only  BOOLEAN      NOT NULL DEFAULT FALSE,
    allows_cross_currency   BOOLEAN      NOT NULL DEFAULT TRUE,
    document_policy         JSONB        NOT NULL DEFAULT '[]'::jsonb,
    field_config            JSONB        NOT NULL DEFAULT '[]'::jsonb,
    is_system               BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    version                 INT          NOT NULL DEFAULT 1,
    effective_from          DATE         NOT NULL DEFAULT CURRENT_DATE,
    effective_to            DATE,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ,
    created_by              UUID,
    updated_by              UUID,
    CONSTRAINT chk_payment_type_direction CHECK (direction IN ('OUTGOING', 'INCOMING'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_types_code_live
    ON payment_types(code) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payment_types_deleted_at
    ON payment_types(deleted_at) WHERE deleted_at IS NULL;

-- Seed the six SoW-defined payment types as `is_system = true` so they
-- can be edited but not deleted.
INSERT INTO payment_types (
    code, name, description, direction, requires_approval_chain,
    is_batch_based, is_confidential, mobile_initiation_only,
    allows_cross_currency, document_policy, field_config, is_system
) VALUES
('VENDOR_PAYMENT',  'Vendor Payment',    'Supplier invoice payment (TT or local clearing).', 'OUTGOING', TRUE,  FALSE, FALSE, FALSE, TRUE,
 '[{"code":"INVOICE","label":"Invoice PDF","required":true},
   {"code":"PO","label":"Purchase Order","required":false},
   {"code":"GRN","label":"Goods Receipt / Service Acceptance","required":false},
   {"code":"COUNTERPARTY_SNAPSHOT","label":"Counterparty Snapshot","required":true}]'::jsonb,
 '[]'::jsonb, TRUE),
('PAYROLL',         'Payroll',           'Monthly salary payment, processed as a batch.',     'OUTGOING', TRUE,  TRUE,  FALSE, FALSE, FALSE,
 '[{"code":"PAYSLIP","label":"Payslip","required":true}]'::jsonb,
 '[]'::jsonb, TRUE),
('REIMBURSEMENT',   'Reimbursement',     'Employee expense reimbursement.',                   'OUTGOING', TRUE,  FALSE, FALSE, FALSE, FALSE,
 '[{"code":"CLAIM_FORM","label":"Claim Form","required":true},
   {"code":"RECEIPTS","label":"Supporting Receipts","required":true}]'::jsonb,
 '[]'::jsonb, TRUE),
('FNF_SETTLEMENT',  'Full & Final Settlement', 'Final settlement on exit (statutory + gratuity by HR).', 'OUTGOING', TRUE, FALSE, FALSE, FALSE, FALSE,
 '[{"code":"SETTLEMENT_LETTER","label":"Settlement Letter","required":true}]'::jsonb,
 '[]'::jsonb, TRUE),
('INCOMING_RECEIPT','Incoming Receipt',  'Expected inbound credit from counterparty.',        'INCOMING', FALSE, FALSE, FALSE, FALSE, TRUE,
 '[{"code":"DEBIT_NOTE","label":"Debit Note / Final Invoice","required":true}]'::jsonb,
 '[]'::jsonb, TRUE),
('CHAIRMAN_PAYMENT','Chairman Payment',  'Confidential payment initiated by the Chairman.',   'OUTGOING', FALSE, FALSE, TRUE,  TRUE,  TRUE,
 '[]'::jsonb,
 '[]'::jsonb, TRUE)
ON CONFLICT DO NOTHING;
