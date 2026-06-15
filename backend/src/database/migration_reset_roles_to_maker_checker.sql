-- =====================================================================
-- Payments Control System — Reset roles to maker/checker column set
--
-- Truncates the roles table (CASCADE wipes user_roles, every approval-
-- matrix step that referenced a role, the payment_types that referenced
-- roles via maker/checker FKs, and downstream approval_matrices /
-- bands). Then inserts the 7 team-style roles taken from the Maker and
-- Checker columns of the Payments Authority Matrix document, and re-
-- assigns every one of them to admin@radiant.com so the admin retains
-- the ability to act as any team while testing.
-- =====================================================================

BEGIN;

TRUNCATE TABLE roles CASCADE;

-- Maker column → 4 roles
-- Checker column → 3 roles
INSERT INTO roles (code, name, description, is_system) VALUES
    ('OPS_TEAM',      'Ops Team',      'Maker — Trade Payments (5.1)',                       FALSE),
    ('TRADING_TEAM',  'Trading Team',  'Maker — Annual Subscription trading platforms',      FALSE),
    ('HR',            'HR',            'Maker — Salaries (5.3)',                             FALSE),
    ('ROHIT_TEAM',    'Rohit Team',    'Maker — Statutory dues (5.3)',                       FALSE),
    ('ACCOUNTS_TEAM', 'Accounts Team', 'Checker — Trade payments, Statutory dues',           FALSE),
    ('TREASURY_TEAM', 'Treasury Team', 'Checker — Salaries (5.3)',                           FALSE),
    ('ABHISHEK_TEAM', 'Abhishek Team', 'Checker — Annual Subscription / Geneva/UK/US rent',  FALSE);

-- Reassign all 7 roles to admin@radiant.com (admin retains is_platform_admin
-- so still gets SUPER_ADMIN implicitly; this just lets them act as any team).
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@radiant.com';

COMMIT;
