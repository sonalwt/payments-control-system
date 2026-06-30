-- =====================================================================
-- Payments Control System — Employee Self-Service Reimbursement
--
-- Adds the storage needed for passwordless employee login (OTP to the
-- employee's work_email) and for employees to raise their own payment
-- requests, which then flow through the EXISTING approval matrix and
-- treasury pipeline unchanged.
--
-- Scope of changes:
--   1. employee_login_otps      — short-lived, single-use login codes.
--   2. payment_requests         — raised_by_employee_id (origin marker).
--   3. payment_types            — employee_self_service (allow-list flag).
--
-- The `users` and `employees` master tables are NOT structurally changed
-- (no password column anywhere). Idempotent — safe to re-run.
-- =====================================================================

-- ── 0. Employee → legal entity link ─────────────────────────────────
-- Some environments built `employees` without this column. It is used to
-- scope which self-service payment types an employee may raise; nullable,
-- and the portal falls back to all self-service types when it is null.
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS legal_entity_id UUID
        REFERENCES legal_entities(id) ON DELETE SET NULL;

-- ── 1. Passwordless login codes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_login_otps (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    -- SHA-256 of the 6-digit code; the plaintext code is only ever emailed.
    code_hash    VARCHAR(255) NOT NULL,
    expires_at   TIMESTAMPTZ  NOT NULL,
    consumed_at  TIMESTAMPTZ,                 -- set once redeemed (single-use)
    attempts     INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Fast lookup of the latest live OTP for an employee.
CREATE INDEX IF NOT EXISTS idx_employee_login_otps_employee
    ON employee_login_otps(employee_id, expires_at);

-- ── 2. Origin of an employee-raised request ─────────────────────────
-- created_by references a USER; an employee-raised request leaves it NULL
-- and records the employee here instead, so attribution stays explicit
-- without faking a user id (audit_log.user_id is an FK to users).
ALTER TABLE payment_requests
    ADD COLUMN IF NOT EXISTS raised_by_employee_id UUID
        REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pr_raised_by_employee
    ON payment_requests(raised_by_employee_id)
    WHERE raised_by_employee_id IS NOT NULL;

-- ── 3. Which payment types an employee may raise themselves ─────────
-- Distinct from mobile_initiation_only (a generic mobile-only flag).
-- Only types flagged here appear in the employee portal and are accepted
-- by the employee create endpoint.
ALTER TABLE payment_types
    ADD COLUMN IF NOT EXISTS employee_self_service BOOLEAN NOT NULL DEFAULT FALSE;
