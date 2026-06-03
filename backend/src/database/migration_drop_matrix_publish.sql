-- =====================================================================
-- Payments Control System — Remove approval-matrix publish lifecycle
--
-- The DRAFT/PUBLISHED/SUPERSEDED workflow has been removed. Matrices are
-- usable as soon as they are created and are now gated only by is_active;
-- payment-request resolution selects the active matrix (latest version)
-- rather than the published one.
--
-- This drops the now-unused publish columns, the status check constraint,
-- and the status index. Idempotent.
-- =====================================================================

BEGIN;

DROP INDEX IF EXISTS idx_matrices_status;

ALTER TABLE approval_matrices
    DROP CONSTRAINT IF EXISTS chk_matrix_status;

-- Older schema snapshots named the constraint differently — drop that too.
ALTER TABLE approval_matrices
    DROP CONSTRAINT IF EXISTS chk_approval_matrix_status;

ALTER TABLE approval_matrices
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS published_at,
    DROP COLUMN IF EXISTS published_by;

COMMIT;
