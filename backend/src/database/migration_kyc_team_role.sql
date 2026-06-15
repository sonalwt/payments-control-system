-- =====================================================================
-- Payments Control System — KYC Team role
--
-- The beneficiary-account change-request workflow (verify / approve /
-- reject / list / view) is handled by the KYC Team instead of the
-- generic CHECKER / APPROVER roles. Initiators still raise the request;
-- only SUPER_ADMIN and KYC_TEAM act on it.
--
-- Idempotent: safe to run more than once.
-- =====================================================================

BEGIN;

INSERT INTO roles (code, name, description, is_system) VALUES
    ('KYC_TEAM', 'KYC Team', 'Verifies and approves beneficiary-account change requests (SoW §6.2)', FALSE)
ON CONFLICT (code) DO NOTHING;

COMMIT;
