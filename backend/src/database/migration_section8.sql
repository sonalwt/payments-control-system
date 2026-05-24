-- =====================================================================
-- Payments Control System — Section 8
-- Vendor Payment: invoice_number + due_date on payment_requests
-- =====================================================================

ALTER TABLE payment_requests
    ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(60),
    ADD COLUMN IF NOT EXISTS due_date       DATE;

COMMENT ON COLUMN payment_requests.invoice_number IS
  'Invoice reference — alphanumeric, no spaces (§4.1). Required for VENDOR_PAYMENT type.';

COMMENT ON COLUMN payment_requests.due_date IS
  'Invoice payment due date (§4.1). Required for VENDOR_PAYMENT type.';

CREATE INDEX IF NOT EXISTS idx_payment_requests_invoice
    ON payment_requests(invoice_number)
    WHERE invoice_number IS NOT NULL;
