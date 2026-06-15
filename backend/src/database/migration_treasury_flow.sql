-- =====================================================================
-- Payments Control System — Treasury Team (TT) post-approval flow
--
-- After a payment request clears the approval matrix it is forwarded to
-- the Treasury Team instead of the retired Release → Mark-Paid flow:
--
--   PENDING_APPROVAL --(final approval)--> TREASURY_MAKER
--      TREASURY_MAKER     : TT maker (online/offline per matrix tt_mode)
--                           captures the bank reference + SWIFT/MT103 copy
--      --> TREASURY_CHECKER     : TT checker marks checked
--      --> TREASURY_AUTHORISER  : TT authoriser marks completed
--      --> COMPLETED (terminal)
--   Any TT stage may REJECT -> REJECTED -> (maker resubmits) -> DRAFT.
--
-- Idempotent: safe to run more than once.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Treasury roles (maker split by TT mode; checker / authoriser shared)
-- ---------------------------------------------------------------------
INSERT INTO roles (code, name, description, is_system) VALUES
    ('TREASURY_MAKER_ONLINE',  'Treasury Maker (Online TT)',  'Treasury maker for Online TT payments — captures bank reference + SWIFT/MT103', FALSE),
    ('TREASURY_MAKER_OFFLINE', 'Treasury Maker (Offline TT)', 'Treasury maker for Offline TT payments — captures bank reference + SWIFT/MT103', FALSE),
    ('TREASURY_CHECKER',       'Treasury Checker',            'Treasury checker — verifies the captured payment info', FALSE),
    ('TREASURY_AUTHORISER',    'Treasury Authoriser',         'Treasury authoriser — marks the payment completed', FALSE)
ON CONFLICT (code) DO NOTHING;

-- Assign the new roles. Admin gets all four (single login exercises the
-- whole flow); a few existing users get one role each so segregation of
-- duties can be tested with distinct accounts.
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = ANY(
    CASE u.email
        WHEN 'admin@radiant.com'       THEN ARRAY['TREASURY_MAKER_ONLINE','TREASURY_MAKER_OFFLINE','TREASURY_CHECKER','TREASURY_AUTHORISER']
        WHEN 'magaeshwari@radiant.com' THEN ARRAY['TREASURY_MAKER_ONLINE']
        WHEN 'shivam@radiant.com'      THEN ARRAY['TREASURY_MAKER_OFFLINE']
        WHEN 'saritha@radiant.com'     THEN ARRAY['TREASURY_CHECKER']
        WHEN 'ali@radiant.com'         THEN ARRAY['TREASURY_AUTHORISER']
        ELSE ARRAY[]::text[]
    END
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2) Approval matrix — TT mode (required; DB default protects legacy seeds)
-- ---------------------------------------------------------------------
ALTER TABLE approval_matrices
    ADD COLUMN IF NOT EXISTS tt_mode VARCHAR(20) NOT NULL DEFAULT 'ONLINE_TT';

ALTER TABLE approval_matrices DROP CONSTRAINT IF EXISTS chk_approval_matrix_tt_mode;
ALTER TABLE approval_matrices
    ADD CONSTRAINT chk_approval_matrix_tt_mode CHECK (tt_mode IN ('ONLINE_TT','OFFLINE_TT'));

-- ---------------------------------------------------------------------
-- 3) Payment request — TT mode snapshot + treasury execution columns
-- ---------------------------------------------------------------------
ALTER TABLE payment_requests
    ADD COLUMN IF NOT EXISTS tt_mode                   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS treasury_reference_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS swift_copy_url            VARCHAR(500),
    ADD COLUMN IF NOT EXISTS treasury_maker_by         UUID,
    ADD COLUMN IF NOT EXISTS treasury_maker_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS treasury_checker_by       UUID,
    ADD COLUMN IF NOT EXISTS treasury_checker_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS treasury_authoriser_by    UUID,
    ADD COLUMN IF NOT EXISTS treasury_authoriser_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at              TIMESTAMPTZ;

ALTER TABLE payment_requests
    ADD CONSTRAINT fk_pr_treasury_maker      FOREIGN KEY (treasury_maker_by)      REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_pr_treasury_checker    FOREIGN KEY (treasury_checker_by)    REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_pr_treasury_authoriser FOREIGN KEY (treasury_authoriser_by) REFERENCES users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 4) Swap the status CHECK constraint, then migrate in-flight rows from
--    the retired statuses. The constraint is dropped FIRST so the data
--    migration can write the new statuses.
-- ---------------------------------------------------------------------
ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS chk_pr_status;

UPDATE payment_requests SET status = 'COMPLETED'      WHERE status = 'PAID';
UPDATE payment_requests SET status = 'TREASURY_MAKER' WHERE status IN ('APPROVED','AWAITING_PAYMENT_CONFIRMATION');

-- Re-add the status constraint with the Treasury lifecycle. The chairman
-- payment states (§9) are preserved so that feature keeps working on DBs
-- where it is enabled.
ALTER TABLE payment_requests
    ADD CONSTRAINT chk_pr_status CHECK (status IN (
        'DRAFT','PENDING_APPROVAL',
        'TREASURY_MAKER','TREASURY_CHECKER','TREASURY_AUTHORISER','COMPLETED',
        'REJECTED','WITHDRAWN','CANCELLED',
        'AWAITING_MAKER_PREP','AWAITING_CHECKER_REVIEW','AWAITING_HEAD_APPROVAL'
    ));

COMMIT;
