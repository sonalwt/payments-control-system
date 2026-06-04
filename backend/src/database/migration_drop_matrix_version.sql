-- =====================================================================
-- Payments Control System — Remove approval-matrix versioning
--
-- Matrices are no longer versioned. A payment type + currency now has at
-- most one matrix per name; payment-request resolution selects the active
-- matrix (most recently created) instead of the highest version.
--
-- Drops:
--   approval_matrices.version          (+ the version-scoped unique index)
--   payment_requests.matrix_version    (snapshot of the applied version)
-- Recreates the matrix uniqueness on (payment_type_id, currency_id, name).
-- Idempotent.
-- =====================================================================

BEGIN;

-- Matrix uniqueness no longer includes version.
DROP INDEX IF EXISTS uq_matrices_pt_ccy_name_version_live;

CREATE UNIQUE INDEX IF NOT EXISTS uq_matrices_pt_ccy_name_live
    ON approval_matrices(payment_type_id, currency_id, name)
    WHERE deleted_at IS NULL;

ALTER TABLE approval_matrices
    DROP COLUMN IF EXISTS version;

ALTER TABLE payment_requests
    DROP COLUMN IF EXISTS matrix_version;

COMMIT;
