-- =====================================================================
-- Payments Control System — User ↔ Department many-to-many
-- A user can be assigned to multiple departments. Idempotent.
-- =====================================================================

CREATE TABLE IF NOT EXISTS user_departments (
    user_id        UUID NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    department_id  UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_user_departments_user_id
    ON user_departments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_departments_department_id
    ON user_departments(department_id);
