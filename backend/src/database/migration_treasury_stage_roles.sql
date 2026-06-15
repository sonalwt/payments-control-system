-- =====================================================================
-- Payments Control System — Treasury-stage roles on the approval matrix
--
-- When a payment type "requires an approval chain", the approval matrix
-- now also pins WHICH ROLE acts at each Treasury Team stage:
--   - treasury_maker_role_id      (captures bank reference + SWIFT/MT103)
--   - treasury_checker_role_id    (verifies the captured info)
--   - treasury_authoriser_role_id (marks the payment completed)
--
-- The TT mode (online/offline) is kept for backwards compatibility and
-- display. The selected roles are frozen onto the payment request when
-- the matrix is snapshotted (§1.5), so in-flight requests are unaffected
-- by later matrix edits. When a snapshot role is NULL (legacy matrices /
-- confidential payments) the treasury stages fall back to the global
-- TREASURY_* roles, preserving existing behaviour.
--
-- Idempotent: safe to run more than once.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Approval matrix — role pinned to each treasury stage
-- ---------------------------------------------------------------------
ALTER TABLE approval_matrices
    ADD COLUMN IF NOT EXISTS treasury_maker_role_id      UUID,
    ADD COLUMN IF NOT EXISTS treasury_checker_role_id    UUID,
    ADD COLUMN IF NOT EXISTS treasury_authoriser_role_id UUID;

ALTER TABLE approval_matrices
    DROP CONSTRAINT IF EXISTS fk_am_treasury_maker_role,
    DROP CONSTRAINT IF EXISTS fk_am_treasury_checker_role,
    DROP CONSTRAINT IF EXISTS fk_am_treasury_authoriser_role;

ALTER TABLE approval_matrices
    ADD CONSTRAINT fk_am_treasury_maker_role      FOREIGN KEY (treasury_maker_role_id)      REFERENCES roles(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_am_treasury_checker_role    FOREIGN KEY (treasury_checker_role_id)    REFERENCES roles(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_am_treasury_authoriser_role FOREIGN KEY (treasury_authoriser_role_id) REFERENCES roles(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------
-- 2) Payment request — frozen snapshot of the three stage roles
-- ---------------------------------------------------------------------
ALTER TABLE payment_requests
    ADD COLUMN IF NOT EXISTS treasury_maker_role_id      UUID,
    ADD COLUMN IF NOT EXISTS treasury_checker_role_id    UUID,
    ADD COLUMN IF NOT EXISTS treasury_authoriser_role_id UUID;

ALTER TABLE payment_requests
    DROP CONSTRAINT IF EXISTS fk_pr_treasury_maker_role,
    DROP CONSTRAINT IF EXISTS fk_pr_treasury_checker_role,
    DROP CONSTRAINT IF EXISTS fk_pr_treasury_authoriser_role;

ALTER TABLE payment_requests
    ADD CONSTRAINT fk_pr_treasury_maker_role      FOREIGN KEY (treasury_maker_role_id)      REFERENCES roles(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_pr_treasury_checker_role    FOREIGN KEY (treasury_checker_role_id)    REFERENCES roles(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_pr_treasury_authoriser_role FOREIGN KEY (treasury_authoriser_role_id) REFERENCES roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pr_treasury_maker_role      ON payment_requests(treasury_maker_role_id)      WHERE treasury_maker_role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pr_treasury_checker_role    ON payment_requests(treasury_checker_role_id)    WHERE treasury_checker_role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pr_treasury_authoriser_role ON payment_requests(treasury_authoriser_role_id) WHERE treasury_authoriser_role_id IS NOT NULL;

COMMIT;
