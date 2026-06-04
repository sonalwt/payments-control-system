-- =====================================================================
-- Payments Control System — Audit Trail
-- Append-only log of every mutating action performed through the API.
--
-- Tables created:
--   audit_logs  — one row per create/update/delete/lifecycle/auth action
--
-- Written by the application's AuditInterceptor; never updated or deleted.
-- Idempotent.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action        VARCHAR(40)  NOT NULL,
    entity_type   VARCHAR(80),
    entity_id     VARCHAR(64),
    user_id       UUID,
    user_email    VARCHAR(200),
    http_method   VARCHAR(10)  NOT NULL,
    path          TEXT         NOT NULL,
    status_code   INT,
    success       BOOLEAN      NOT NULL DEFAULT TRUE,
    params        JSONB,
    request_body  JSONB,
    error_message TEXT,
    ip_address    VARCHAR(64),
    user_agent    TEXT,
    duration_ms   INT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON audit_logs (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs (created_at DESC);

COMMIT;
