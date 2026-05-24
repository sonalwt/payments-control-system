-- =====================================================================
-- Payments Control System — Section 7
-- Proof-of-Payment Exception Reports
-- =====================================================================
-- One report row is generated per calendar day by the nightly cron job
-- (23:55 server time). Each report captures every PAID payment request
-- from that day that was still missing its proof_of_payment_url.
-- =====================================================================

CREATE TABLE IF NOT EXISTS exception_reports (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The calendar date this report covers (paid_at::date = report_date).
    report_date     DATE        NOT NULL,
    -- Denormalised count for quick dashboard display.
    total_missing   INTEGER     NOT NULL DEFAULT 0,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exception_report_date UNIQUE (report_date)
);

CREATE TABLE IF NOT EXISTS exception_report_items (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id           UUID        NOT NULL REFERENCES exception_reports(id) ON DELETE CASCADE,
    payment_request_id  UUID        NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    request_number      VARCHAR(30) NOT NULL,
    legal_entity_name   VARCHAR(200),
    currency_code       VARCHAR(10) NOT NULL,
    amount              NUMERIC(20,6) NOT NULL,
    paid_at             TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exception_reports_date
    ON exception_reports(report_date DESC);

CREATE INDEX IF NOT EXISTS idx_exception_report_items_report
    ON exception_report_items(report_id);
