-- =====================================================================
-- Payments Control System — Password-reset OTP
--
-- Adds storage for password-reset one-time codes. When a user requests a
-- reset, a 6-digit code is generated and emailed to an ADMINISTRATOR (never
-- the requesting user). Only the SHA-256 hash of the code is stored. After
-- the code is verified, the caller is issued a short-lived reset token to
-- choose a new password.
--
-- Idempotent — safe to re-run.
-- =====================================================================

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- SHA-256 of the 6-digit code; the plaintext code is only ever emailed.
    code_hash    VARCHAR(255) NOT NULL,
    expires_at   TIMESTAMPTZ  NOT NULL,
    consumed_at  TIMESTAMPTZ,                 -- set once redeemed (single-use)
    attempts     INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Fast lookup of the latest live OTP for a user.
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user
    ON password_reset_otps(user_id, expires_at);
