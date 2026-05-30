-- =====================================================================
-- Payments Control System — Post-truncate seed
--
-- Seeds:
--   • 15 roles (SUPER_ADMIN, COUNTERPARTY, INITIATOR/CHECKER/APPROVER_1/
--     APPROVER_2 for route access, plus team-style roles referenced by
--     the authority matrix).
--   • 12 users with bcrypt-hashed password "Radiant@1234".
--   • 4 payment categories.
--   • Payment types only for matrices that have complete information
--     in the Authority Matrix document. Vendor Payments (empty checker
--     column) and Consultants (empty checker + A2) are intentionally
--     skipped. For Annual Subscriptions only the "Above 50,000" band is
--     included — the lower bands have an empty Approver 2.
--
-- Idempotent on names / codes / emails.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Roles
-- ---------------------------------------------------------------------
INSERT INTO roles (code, name, description, is_system) VALUES
    ('SUPER_ADMIN',            'Super Admin',            'Highest privilege; administrative operations', TRUE),
    ('COUNTERPARTY',           'Counterparty',           'External counterparty user', TRUE),
    ('INITIATOR',              'Initiator',              'Creates payment requests', TRUE),
    ('CHECKER',                'Checker',                'Verifies documents on payment requests', TRUE),
    ('APPROVER_1',             'Approver Level 1',       'First-level approval authority', TRUE),
    ('APPROVER_2',             'Approver Level 2',       'Second-level approval authority', TRUE),
    ('OPS_TEAM',               'Ops Team',               'Operations team — Maker for Trade payments', FALSE),
    ('ACCOUNTS_TEAM',          'Accounts Team',          'Accounts verification team', FALSE),
    ('TREASURY_TEAM',          'Treasury Team',          'Treasury — verifies salary payouts', FALSE),
    ('HR_TEAM',                'HR',                     'Human Resources — Maker for Salaries', FALSE),
    ('TRADING_TEAM',           'Trading Team',           'Commodity trading desk', FALSE),
    ('ABHISHEK_TEAM',          'Abhishek Team',          'Abhishek''s verification team', FALSE),
    ('AUDIT_TEAM_HEAD',        'Audit Team Head',        'Audit Team Head — Approver for Statutory dues', FALSE),
    ('ROHIT_TEAM',             'Rohit Team',             'Rohit''s team — Maker for Statutory dues', FALSE),
    ('SUBSCRIPTION_APPROVERS', 'Subscription Approvers', 'Tarang or Ganesh — Annual Subscription approver group', FALSE)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2) Users — bcrypt hash of "Radiant@1234"
-- ---------------------------------------------------------------------
INSERT INTO users (email, password_hash, full_name, is_active, is_platform_admin) VALUES
    ('admin@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Admin',         TRUE, TRUE),
    ('counterparty@radiant.com', '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Counterparty', TRUE, FALSE),
    ('ganesh@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Ganesh',        TRUE, FALSE),
    ('pinkesh@radiant.com',     '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Pinkesh',       TRUE, FALSE),
    ('venessa@radiant.com',     '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Venessa',       TRUE, FALSE),
    ('sachin@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Sachin',        TRUE, FALSE),
    ('magaeshwari@radiant.com', '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Magaeshwari',   TRUE, FALSE),
    ('shivam@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Shivam',        TRUE, FALSE),
    ('ghizlane@radiant.com',    '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Ghizlane',      TRUE, FALSE),
    ('saritha@radiant.com',     '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Saritha',       TRUE, FALSE),
    ('ali@radiant.com',         '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Mr Ali',        TRUE, FALSE),
    ('tarang@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Tarang',        TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3) Assign users to roles
--    Admin gets every role so a single login can exercise every flow.
--    Other users get the roles their position in the authority matrix
--    actually demands.
-- ---------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = ANY(
    CASE u.email
        WHEN 'admin@radiant.com'        THEN ARRAY[
            'SUPER_ADMIN','INITIATOR','CHECKER','APPROVER_1','APPROVER_2',
            'OPS_TEAM','ACCOUNTS_TEAM','TREASURY_TEAM','HR_TEAM',
            'TRADING_TEAM','ABHISHEK_TEAM','AUDIT_TEAM_HEAD','ROHIT_TEAM',
            'SUBSCRIPTION_APPROVERS'
        ]
        WHEN 'counterparty@radiant.com' THEN ARRAY['COUNTERPARTY']
        WHEN 'ganesh@radiant.com'       THEN ARRAY['APPROVER_1','APPROVER_2','SUBSCRIPTION_APPROVERS']
        WHEN 'pinkesh@radiant.com'      THEN ARRAY['APPROVER_2']
        WHEN 'venessa@radiant.com'      THEN ARRAY['INITIATOR']
        WHEN 'sachin@radiant.com'       THEN ARRAY['CHECKER','APPROVER_1']
        WHEN 'magaeshwari@radiant.com'  THEN ARRAY['INITIATOR','CHECKER']
        WHEN 'shivam@radiant.com'       THEN ARRAY['INITIATOR','CHECKER']
        WHEN 'ghizlane@radiant.com'     THEN ARRAY['INITIATOR']
        WHEN 'saritha@radiant.com'      THEN ARRAY['INITIATOR']
        WHEN 'ali@radiant.com'          THEN ARRAY['APPROVER_1']
        WHEN 'tarang@radiant.com'       THEN ARRAY['APPROVER_1','SUBSCRIPTION_APPROVERS']
        ELSE ARRAY[]::text[]
    END
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 4) Payment categories (§4 of policy doc)
-- ---------------------------------------------------------------------
INSERT INTO payment_categories (name, is_active) VALUES
    ('Trade Payments',       TRUE),
    ('Non-Trade Payments',   TRUE),
    ('Capital Expenditure',  TRUE),
    ('Exceptional Payments', TRUE)
ON CONFLICT (name) WHERE deleted_at IS NULL DO NOTHING;

-- ---------------------------------------------------------------------
-- 5) Payment types — only those whose matrix has complete information.
-- ---------------------------------------------------------------------
INSERT INTO payment_types (
    code, name, description, direction, requires_approval_chain, is_system,
    payment_category_id, maker_role_id, checker_role_id
)
SELECT v.code, v.name, v.description, v.direction, TRUE, TRUE,
       (SELECT id FROM payment_categories WHERE name = v.category   AND deleted_at IS NULL),
       (SELECT id FROM roles              WHERE code = v.maker_code AND deleted_at IS NULL),
       (SELECT id FROM roles              WHERE code = v.checker_code AND deleted_at IS NULL)
FROM (VALUES
    ('TRADE_PAYMENT',        'Trade Payment',                 'Trade payments — section 5.1.',                                  'OUTGOING', 'Trade Payments',       'OPS_TEAM',     'ACCOUNTS_TEAM'),
    ('TRAVEL_DESK',          'Travel Desk Payment',           'Non-trade travel desk payments — section 5.2.',                  'OUTGOING', 'Non-Trade Payments',   NULL,           NULL),
    ('ANNUAL_SUBSCRIPTION',  'Annual Subscription',           'Trading platform subscriptions (Above 50k band only — only band with complete info).', 'OUTGOING', 'Non-Trade Payments', 'TRADING_TEAM', 'ABHISHEK_TEAM'),
    ('SALARIES',             'Salaries',                      'Monthly salary payments — section 5.3.',                         'OUTGOING', 'Non-Trade Payments',   'HR_TEAM',      'TREASURY_TEAM'),
    ('STATUTORY_DUES',       'Statutory Dues',                'Statutory dues (VAT, TDS) — section 5.3.',                       'OUTGOING', 'Non-Trade Payments',   'ROHIT_TEAM',   'ACCOUNTS_TEAM'),
    ('RENT_UTIL_SG',         'Rent & Utilities — Singapore',  'Rent and utilities — Singapore office.',                         'OUTGOING', 'Non-Trade Payments',   NULL,           NULL),
    ('RENT_UTIL_DXB',        'Rent & Utilities — Dubai',      'Rent and utilities — Dubai office.',                             'OUTGOING', 'Non-Trade Payments',   NULL,           NULL),
    ('RENT_UTIL_GENEVA',     'Rent & Utilities — Geneva',     'Rent and utilities — Geneva office.',                            'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('RENT_UTIL_UK',         'Rent & Utilities — UK',         'Rent and utilities — UK office.',                                'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('RENT_UTIL_US',         'Rent & Utilities — US',         'Rent and utilities — US office.',                                'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('CAPEX',                'Capital Expenditure',           'Capex — single approver per band — section 5.4.',                'OUTGOING', 'Capital Expenditure',  NULL,           NULL),
    ('EXCEPTIONAL_MA',       'Exceptional — M&A',             'M&A transactions — section 5.5.',                                'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_RPT',      'Exceptional — Related Party',   'Related party transactions — section 5.5.',                      'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_LEGAL',    'Exceptional — Legal Settlement','Legal settlements — section 5.5.',                               'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_WRITEOFF', 'Exceptional — Write-off',       'Write-offs — section 5.5.',                                      'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_CSR',      'Exceptional — CSR / Donations', 'CSR and donations — section 5.5.',                               'OUTGOING', 'Exceptional Payments', NULL,           NULL)
) AS v(code, name, description, direction, category, maker_code, checker_code);

-- ---------------------------------------------------------------------
-- 6) Approval matrices, bands, and steps
-- ---------------------------------------------------------------------
DO $$
DECLARE
    v_currency_usd UUID;

    -- payment type ids
    pt_trade         UUID; pt_travel        UUID; pt_subscription UUID;
    pt_salaries      UUID; pt_statutory     UUID;
    pt_rent_sg       UUID; pt_rent_dxb      UUID; pt_rent_geneva  UUID;
    pt_rent_uk       UUID; pt_rent_us       UUID;
    pt_capex         UUID;
    pt_exc_ma        UUID; pt_exc_rpt       UUID;
    pt_exc_legal     UUID; pt_exc_writeoff  UUID; pt_exc_csr      UUID;

    -- role ids
    r_ops_team       UUID; r_accounts       UUID; r_treasury      UUID;
    r_hr             UUID; r_trading        UUID; r_abhishek      UUID;
    r_audit_head     UUID; r_rohit_team     UUID; r_subs_app      UUID;

    -- user ids
    u_ganesh         UUID; u_pinkesh        UUID; u_venessa       UUID;
    u_sachin         UUID; u_tarang         UUID;
    u_shivam         UUID; u_magaeshwari    UUID; u_saritha       UUID;
    u_ghizlane       UUID; u_ali            UUID;

    v_matrix_id      UUID;
    v_band_id        UUID;
BEGIN
    SELECT id INTO v_currency_usd FROM currencies WHERE code = 'USD' LIMIT 1;

    SELECT id INTO pt_trade         FROM payment_types WHERE code = 'TRADE_PAYMENT';
    SELECT id INTO pt_travel        FROM payment_types WHERE code = 'TRAVEL_DESK';
    SELECT id INTO pt_subscription  FROM payment_types WHERE code = 'ANNUAL_SUBSCRIPTION';
    SELECT id INTO pt_salaries      FROM payment_types WHERE code = 'SALARIES';
    SELECT id INTO pt_statutory     FROM payment_types WHERE code = 'STATUTORY_DUES';
    SELECT id INTO pt_rent_sg       FROM payment_types WHERE code = 'RENT_UTIL_SG';
    SELECT id INTO pt_rent_dxb      FROM payment_types WHERE code = 'RENT_UTIL_DXB';
    SELECT id INTO pt_rent_geneva   FROM payment_types WHERE code = 'RENT_UTIL_GENEVA';
    SELECT id INTO pt_rent_uk       FROM payment_types WHERE code = 'RENT_UTIL_UK';
    SELECT id INTO pt_rent_us       FROM payment_types WHERE code = 'RENT_UTIL_US';
    SELECT id INTO pt_capex         FROM payment_types WHERE code = 'CAPEX';
    SELECT id INTO pt_exc_ma        FROM payment_types WHERE code = 'EXCEPTIONAL_MA';
    SELECT id INTO pt_exc_rpt       FROM payment_types WHERE code = 'EXCEPTIONAL_RPT';
    SELECT id INTO pt_exc_legal     FROM payment_types WHERE code = 'EXCEPTIONAL_LEGAL';
    SELECT id INTO pt_exc_writeoff  FROM payment_types WHERE code = 'EXCEPTIONAL_WRITEOFF';
    SELECT id INTO pt_exc_csr       FROM payment_types WHERE code = 'EXCEPTIONAL_CSR';

    SELECT id INTO r_ops_team    FROM roles WHERE code = 'OPS_TEAM';
    SELECT id INTO r_accounts    FROM roles WHERE code = 'ACCOUNTS_TEAM';
    SELECT id INTO r_treasury    FROM roles WHERE code = 'TREASURY_TEAM';
    SELECT id INTO r_hr          FROM roles WHERE code = 'HR_TEAM';
    SELECT id INTO r_trading     FROM roles WHERE code = 'TRADING_TEAM';
    SELECT id INTO r_abhishek    FROM roles WHERE code = 'ABHISHEK_TEAM';
    SELECT id INTO r_audit_head  FROM roles WHERE code = 'AUDIT_TEAM_HEAD';
    SELECT id INTO r_rohit_team  FROM roles WHERE code = 'ROHIT_TEAM';
    SELECT id INTO r_subs_app    FROM roles WHERE code = 'SUBSCRIPTION_APPROVERS';

    SELECT id INTO u_ganesh       FROM users WHERE email = 'ganesh@radiant.com';
    SELECT id INTO u_pinkesh      FROM users WHERE email = 'pinkesh@radiant.com';
    SELECT id INTO u_venessa      FROM users WHERE email = 'venessa@radiant.com';
    SELECT id INTO u_sachin       FROM users WHERE email = 'sachin@radiant.com';
    SELECT id INTO u_tarang       FROM users WHERE email = 'tarang@radiant.com';
    SELECT id INTO u_shivam       FROM users WHERE email = 'shivam@radiant.com';
    SELECT id INTO u_magaeshwari  FROM users WHERE email = 'magaeshwari@radiant.com';
    SELECT id INTO u_saritha      FROM users WHERE email = 'saritha@radiant.com';
    SELECT id INTO u_ghizlane     FROM users WHERE email = 'ghizlane@radiant.com';
    SELECT id INTO u_ali          FROM users WHERE email = 'ali@radiant.com';

    -- =================================================================
    -- 5.1 Trade Payments (all 4 bands complete)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Trade Payments — Authority Matrix', 'Per policy section 5.1', pt_trade, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, 100000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team, NULL),
        (v_band_id, 2, 'ROLE', r_accounts, NULL),
        (v_band_id, 3, 'USER', NULL, u_ganesh),
        (v_band_id, 4, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 2, 100000.0001, 500000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team, NULL),
        (v_band_id, 2, 'ROLE', r_accounts, NULL),
        (v_band_id, 3, 'USER', NULL, u_ganesh),
        (v_band_id, 4, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 3, 500000.0001, 1000000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team, NULL),
        (v_band_id, 2, 'ROLE', r_accounts, NULL),
        (v_band_id, 3, 'USER', NULL, u_ganesh),
        (v_band_id, 4, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 4, 1000000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team, NULL),
        (v_band_id, 2, 'ROLE', r_accounts, NULL),
        (v_band_id, 3, 'USER', NULL, u_ganesh),
        (v_band_id, 4, 'USER', NULL, u_pinkesh);

    -- =================================================================
    -- 5.2 Travel Desk (all 3 bands complete)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Travel Desk — Authority Matrix', 'Per policy section 5.2', pt_travel, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, 1000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_venessa),
        (v_band_id, 2, 'USER', NULL, u_sachin),
        (v_band_id, 3, 'USER', NULL, u_sachin),
        (v_band_id, 4, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 2, 1000.0001, 10000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_venessa),
        (v_band_id, 2, 'USER', NULL, u_sachin),
        (v_band_id, 3, 'USER', NULL, u_sachin),
        (v_band_id, 4, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 3, 10000.0001, 25000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_venessa),
        (v_band_id, 2, 'USER', NULL, u_sachin),
        (v_band_id, 3, 'USER', NULL, u_sachin),
        (v_band_id, 4, 'USER', NULL, u_pinkesh);

    -- =================================================================
    -- Annual Subscriptions — only the "Above 50,000" band has complete
    -- info (Maker / Checker / A1 / A2). Lower bands have no A2.
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Annual Subscription — Authority Matrix',
            'Per policy section 5 (Annual subscriptions — Above 50,000 band only).',
            pt_subscription, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 50000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_trading,  NULL),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'ROLE', r_subs_app, NULL),
        (v_band_id, 4, 'USER', NULL,       u_pinkesh);

    -- =================================================================
    -- 5.3 Salaries — single band (any amount)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Salaries — Authority Matrix', 'Per policy section 5.3', pt_salaries, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_hr,       NULL),
        (v_band_id, 2, 'ROLE', r_treasury, NULL),
        (v_band_id, 3, 'USER', NULL,       u_ganesh);

    -- =================================================================
    -- 5.3 Statutory Dues
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Statutory Dues — Authority Matrix', 'Per policy section 5.3 (VAT, TDS)', pt_statutory, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_rohit_team, NULL),
        (v_band_id, 2, 'ROLE', r_accounts,   NULL),
        (v_band_id, 3, 'ROLE', r_audit_head, NULL);

    -- =================================================================
    -- 5.3 Rent & Utilities — Singapore (Magaeshwari/Magaeshwari/Ganesh)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities — Singapore Office', 'Per policy section 5.3', pt_rent_sg, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_magaeshwari),
        (v_band_id, 2, 'USER', NULL, u_magaeshwari),
        (v_band_id, 3, 'USER', NULL, u_ganesh);

    -- =================================================================
    -- 5.3 Rent & Utilities — Dubai (Shivam/Shivam/Mr Ali)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities — Dubai Office', 'Per policy section 5.3', pt_rent_dxb, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_shivam),
        (v_band_id, 2, 'USER', NULL, u_shivam),
        (v_band_id, 3, 'USER', NULL, u_ali);

    -- =================================================================
    -- 5.3 Rent & Utilities — Geneva (Ghizlane/Abhishek Team/Tarang)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities — Geneva Office', 'Per policy section 5.3', pt_rent_geneva, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_ghizlane),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- =================================================================
    -- 5.3 Rent & Utilities — UK (Saritha/Abhishek Team/Tarang)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities — UK Office', 'Per policy section 5.3', pt_rent_uk, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_saritha),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- =================================================================
    -- 5.3 Rent & Utilities — US (Saritha/Abhishek Team/Tarang)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities — US Office', 'Per policy section 5.3', pt_rent_us, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_saritha),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- =================================================================
    -- 5.4 Capex — single approver (Pinkesh) per band, all bands.
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Capital Expenditure — Authority Matrix', 'Per policy section 5.4', pt_capex, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, 50000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 2, 50000.0001, 200000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 3, 200000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    -- =================================================================
    -- 5.5 Exceptional Payments — single approver (Pinkesh) per matrix
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional — M&A', 'Per policy section 5.5', pt_exc_ma, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional — Related Party', 'Per policy section 5.5', pt_exc_rpt, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional — Legal Settlement', 'Per policy section 5.5', pt_exc_legal, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional — Write-off', 'Per policy section 5.5', pt_exc_writeoff, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional — CSR / Donations', 'Per policy section 5.5', pt_exc_csr, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);
END $$;

COMMIT;
