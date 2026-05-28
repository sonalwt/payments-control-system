-- =====================================================================
-- Payments Control System — Section 1.5 Approval Matrix Configuration
--
-- Header (`approval_matrices`) carries payment type + currency + version
-- + status + effective window. Each matrix has one or more bands
-- (`approval_matrix_bands`) keyed by amount range, and each band has an
-- ordered chain of steps (`approval_matrix_steps`). Steps reference
-- either a specific user or a role.
--
-- Idempotent.
-- =====================================================================

CREATE TABLE IF NOT EXISTS approval_matrices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(150) NOT NULL,
    description       TEXT,
    payment_type_id   UUID NOT NULL REFERENCES payment_types(id) ON DELETE RESTRICT,
    currency_id       UUID NOT NULL REFERENCES currencies(id)    ON DELETE RESTRICT,
    version           INT  NOT NULL DEFAULT 1,
    status            VARCHAR(15) NOT NULL DEFAULT 'DRAFT',
    effective_from    DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to      DATE,
    published_at      TIMESTAMPTZ,
    published_by      UUID,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ,
    created_by        UUID,
    updated_by        UUID,
    CONSTRAINT chk_matrix_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'SUPERSEDED'))
);

CREATE INDEX IF NOT EXISTS idx_matrices_payment_type  ON approval_matrices(payment_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_matrices_currency      ON approval_matrices(currency_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_matrices_status        ON approval_matrices(status)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_matrices_deleted_at    ON approval_matrices(deleted_at)       WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_matrices_pt_ccy_name_version_live
    ON approval_matrices(payment_type_id, currency_id, name, version)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS approval_matrix_bands (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matrix_id       UUID NOT NULL REFERENCES approval_matrices(id) ON DELETE CASCADE,
    sort_order      INT  NOT NULL,
    min_amount      DECIMAL(20,4) NOT NULL,
    max_amount      DECIMAL(20,4),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_band_amounts CHECK (max_amount IS NULL OR max_amount > min_amount)
);
CREATE INDEX IF NOT EXISTS idx_bands_matrix_id ON approval_matrix_bands(matrix_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_bands_matrix_sort ON approval_matrix_bands(matrix_id, sort_order);

CREATE TABLE IF NOT EXISTS approval_matrix_steps (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id             UUID NOT NULL REFERENCES approval_matrix_bands(id) ON DELETE CASCADE,
    step_order          INT  NOT NULL,
    approver_type       VARCHAR(10) NOT NULL,
    approver_user_id    UUID REFERENCES users(id) ON DELETE RESTRICT,
    approver_role_id    UUID REFERENCES roles(id) ON DELETE RESTRICT,
    is_optional         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_step_approver_type CHECK (approver_type IN ('USER', 'ROLE')),
    CONSTRAINT chk_step_approver_target CHECK (
        (approver_type = 'USER' AND approver_user_id IS NOT NULL AND approver_role_id IS NULL)
     OR (approver_type = 'ROLE' AND approver_role_id IS NOT NULL AND approver_user_id IS NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_steps_band_id ON approval_matrix_steps(band_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_steps_band_order ON approval_matrix_steps(band_id, step_order);
