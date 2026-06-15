-- =====================================================================
-- Payments Control System — Authority Matrix Re-seed (v2)
-- Source: "Payments Authority Matrix - Radiant" policy document
--
-- Assumes the payment_types / approval_matrices tables are empty
-- (the user just truncated them) and that payment_categories + the
-- team-style roles + the named users already exist (left over from
-- the earlier authority-matrix seed).
--
-- New in v2: payment_types now carries payment_category_id,
-- maker_role_id, checker_role_id alongside the prior columns.
-- Matrix bands and steps are recreated identically to the prior seed.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Payment types — now with category + default Maker/Checker roles
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
    ('TRADE_PAYMENT',        'Trade Payment',                  'Trade payments — supplier, advance, import (LC/BG), derivative margins, trade-finance bank funding.', 'OUTGOING', 'Trade Payments',       'OPS_TEAM',     'ACCOUNTS_TEAM'),
    ('TRAVEL_DESK',          'Travel Desk Payment',            'Non-trade travel desk payments. Maker: Venessa. Checker: Sachin.',                                    'OUTGOING', 'Non-Trade Payments',   NULL,           NULL),
    ('VENDOR_PAYMENT_NT',    'Vendor Payment (Non-Trade)',     'Non-trade vendor payments. Makers: Shivam, Magaeshwari, Saritha, Ghizlane, Mark, Shoaib, Richard, Venessa, Pritesh, Shiv Shakthi, Nilesh, Vinayak, Ahmad, Asmita.', 'OUTGOING', 'Non-Trade Payments', 'OPS_TEAM', NULL),
    ('ANNUAL_SUBSCRIPTION',  'Annual Subscription',            'Trading platform subscriptions — iron ore, base metals.',                                            'OUTGOING', 'Non-Trade Payments',   'TRADING_TEAM', 'ABHISHEK_TEAM'),
    ('CONSULTANT_PAYMENT',   'Consultant / Corp Sec Payment',  'Consultants, corporate secretarial, renewals. Makers: Saritha, Pritesh, Sandip, Rohit, Vinayak, Priyanka.', 'OUTGOING', 'Non-Trade Payments', 'OPS_TEAM', NULL),
    ('SALARIES',             'Salaries',                       'Monthly salary payments.',                                                                           'OUTGOING', 'Non-Trade Payments',   'HR_TEAM',      'TREASURY_TEAM'),
    ('STATUTORY_DUES',       'Statutory Dues',                 'Statutory dues — VAT, TDS.',                                                                         'OUTGOING', 'Non-Trade Payments',   'ROHIT_TEAM',   'ACCOUNTS_TEAM'),
    ('RENT_UTIL_SG',         'Rent & Utilities — Singapore',   'Rent and utilities for the Singapore office. Maker/Checker: Magaeshwari (per doc).',                 'OUTGOING', 'Non-Trade Payments',   NULL,           NULL),
    ('RENT_UTIL_DXB',        'Rent & Utilities — Dubai',       'Rent and utilities for the Dubai office. Maker/Checker: Shivam (per doc).',                          'OUTGOING', 'Non-Trade Payments',   NULL,           NULL),
    ('RENT_UTIL_GENEVA',     'Rent & Utilities — Geneva',      'Rent and utilities for the Geneva office. Maker: Ghizlane.',                                         'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('RENT_UTIL_UK',         'Rent & Utilities — UK',          'Rent and utilities for the UK office. Maker: Saritha.',                                              'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('RENT_UTIL_US',         'Rent & Utilities — US',          'Rent and utilities for the US office. Maker: Saritha.',                                              'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('CAPEX',                'Capital Expenditure',            'Capex — asset purchases, infrastructure investments.',                                               'OUTGOING', 'Capital Expenditure',  NULL,           NULL),
    ('EXCEPTIONAL_MA',       'Exceptional — M&A',              'M&A transactions.',                                                                                  'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_RPT',      'Exceptional — Related Party',    'Related party transactions.',                                                                        'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_LEGAL',    'Exceptional — Legal Settlement', 'Legal settlements.',                                                                                 'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_WRITEOFF', 'Exceptional — Write-off',        'Write-offs.',                                                                                        'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_CSR',      'Exceptional — CSR / Donations',  'CSR and donations.',                                                                                 'OUTGOING', 'Exceptional Payments', NULL,           NULL)
) AS v(code, name, description, direction, category, maker_code, checker_code);

-- ---------------------------------------------------------------------
-- 2) Approval matrices, bands, and steps — re-create per the policy.
--    Step convention: 1 = Maker, 2 = Checker, 3 = Approver 1, 4 = Approver 2.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    v_currency_usd UUID;

    -- payment type IDs
    pt_trade         UUID; pt_travel        UUID; pt_vendor_nt    UUID;
    pt_subscription  UUID; pt_consultant    UUID; pt_salaries     UUID;
    pt_statutory     UUID; pt_rent_sg       UUID; pt_rent_dxb     UUID;
    pt_rent_geneva   UUID; pt_rent_uk       UUID; pt_rent_us      UUID;
    pt_capex         UUID; pt_exc_ma        UUID; pt_exc_rpt      UUID;
    pt_exc_legal     UUID; pt_exc_writeoff  UUID; pt_exc_csr      UUID;

    -- role IDs
    r_ops_team       UUID; r_accounts       UUID; r_treasury      UUID;
    r_hr             UUID; r_trading        UUID; r_abhishek      UUID;
    r_audit_head     UUID; r_rohit_team     UUID; r_vendor_app    UUID;
    r_subs_app       UUID; r_consult_app    UUID;

    -- user IDs
    u_ganesh         UUID; u_pinkesh        UUID; u_venessa       UUID;
    u_sachin         UUID; u_tarang         UUID;
    u_shivam         UUID; u_magaeshwari    UUID; u_saritha       UUID;
    u_ghizlane       UUID; u_ali            UUID;

    -- working
    v_matrix_id      UUID;
    v_band_id        UUID;
BEGIN
    SELECT id INTO v_currency_usd FROM currencies WHERE code = 'USD' LIMIT 1;

    SELECT id INTO pt_trade         FROM payment_types WHERE code = 'TRADE_PAYMENT';
    SELECT id INTO pt_travel        FROM payment_types WHERE code = 'TRAVEL_DESK';
    SELECT id INTO pt_vendor_nt     FROM payment_types WHERE code = 'VENDOR_PAYMENT_NT';
    SELECT id INTO pt_subscription  FROM payment_types WHERE code = 'ANNUAL_SUBSCRIPTION';
    SELECT id INTO pt_consultant    FROM payment_types WHERE code = 'CONSULTANT_PAYMENT';
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
    SELECT id INTO r_vendor_app  FROM roles WHERE code = 'VENDOR_APPROVERS';
    SELECT id INTO r_subs_app    FROM roles WHERE code = 'SUBSCRIPTION_APPROVERS';
    SELECT id INTO r_consult_app FROM roles WHERE code = 'CONSULTANT_APPROVERS';

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

    -- 5.1 Trade Payments
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Trade Payments — Authority Matrix', 'Per policy section 5.1', pt_trade, v_currency_usd)
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

    -- 5.2 Travel Desk
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Travel Desk — Authority Matrix', 'Per policy section 5.2', pt_travel, v_currency_usd)
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

    -- Vendor Payments (Non-Trade)
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Vendor Payments (Non-Trade) — Authority Matrix',
            'Per policy section 5 (Vendor payments). Makers: Shivam, Magaeshwari, Saritha, Ghizlane, Mark, Shoaib, Richard, Venessa, Pritesh, Shiv Shakthi, Nilesh, Vinayak, Ahmad, Asmita.',
            pt_vendor_nt, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, 1000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team,   NULL),
        (v_band_id, 3, 'ROLE', r_vendor_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 2, 1000.0001, 10000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team,   NULL),
        (v_band_id, 3, 'ROLE', r_vendor_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 3, 10000.0001, 25000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team,   NULL),
        (v_band_id, 3, 'ROLE', r_vendor_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 4, 25000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team,   NULL),
        (v_band_id, 3, 'ROLE', r_vendor_app, NULL),
        (v_band_id, 4, 'USER', NULL,         u_pinkesh);

    -- Annual Subscription
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Annual Subscription — Authority Matrix', 'Per policy section 5 (Annual subscriptions — iron ore / base metals).',
            pt_subscription, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, 1000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_trading,  NULL),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'ROLE', r_subs_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 2, 1000.0001, 10000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_trading,  NULL),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'ROLE', r_subs_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 3, 10000.0001, 50000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_trading,  NULL),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'ROLE', r_subs_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 4, 50000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_trading,  NULL),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'ROLE', r_subs_app, NULL),
        (v_band_id, 4, 'USER', NULL,       u_pinkesh);

    -- Consultants / Corp Sec / Renewals
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Consultants / Corp Sec / Renewals — Authority Matrix',
            'Per policy section 5. Makers: Saritha, Pritesh, Sandip, Rohit, Vinayak, Priyanka.',
            pt_consultant, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, 1000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team,    NULL),
        (v_band_id, 3, 'ROLE', r_consult_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 2, 1000.0001, 10000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team,    NULL),
        (v_band_id, 3, 'ROLE', r_consult_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 3, 10000.0001, 50000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team,    NULL),
        (v_band_id, 3, 'ROLE', r_consult_app, NULL);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 4, 50000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_ops_team,    NULL),
        (v_band_id, 3, 'ROLE', r_consult_app, NULL);

    -- 5.3 Salaries
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Salaries — Authority Matrix', 'Per policy section 5.3', pt_salaries, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_hr,       NULL),
        (v_band_id, 2, 'ROLE', r_treasury, NULL),
        (v_band_id, 3, 'USER', NULL,       u_ganesh);

    -- Statutory Dues
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Statutory Dues — Authority Matrix', 'Per policy section 5.3 (VAT, TDS)', pt_statutory, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_rohit_team, NULL),
        (v_band_id, 2, 'ROLE', r_accounts,   NULL),
        (v_band_id, 3, 'ROLE', r_audit_head, NULL);

    -- Rent SG
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Rent & Utilities — Singapore Office', 'Per policy section 5.3', pt_rent_sg, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_magaeshwari),
        (v_band_id, 2, 'USER', NULL, u_magaeshwari),
        (v_band_id, 3, 'USER', NULL, u_ganesh);

    -- Rent DXB
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Rent & Utilities — Dubai Office', 'Per policy section 5.3', pt_rent_dxb, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_shivam),
        (v_band_id, 2, 'USER', NULL, u_shivam),
        (v_band_id, 3, 'USER', NULL, u_ali);

    -- Rent Geneva
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Rent & Utilities — Geneva Office', 'Per policy section 5.3', pt_rent_geneva, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_ghizlane),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- Rent UK
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Rent & Utilities — UK Office', 'Per policy section 5.3', pt_rent_uk, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_saritha),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- Rent US
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Rent & Utilities — US Office', 'Per policy section 5.3', pt_rent_us, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_saritha),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- 5.4 Capex
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Capital Expenditure — Authority Matrix', 'Per policy section 5.4', pt_capex, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, 50000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 3, 'USER', NULL, u_pinkesh);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 2, 50000.0001, 200000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 3, 'USER', NULL, u_pinkesh);
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 3, 200000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 3, 'USER', NULL, u_pinkesh);

    -- 5.5 Exceptional Payments
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Exceptional — M&A', 'Per policy section 5.5', pt_exc_ma, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 3, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Exceptional — Related Party', 'Per policy section 5.5', pt_exc_rpt, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 3, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Exceptional — Legal Settlement', 'Per policy section 5.5', pt_exc_legal, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 3, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Exceptional — Write-off', 'Per policy section 5.5', pt_exc_writeoff, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 3, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id)
    VALUES ('Exceptional — CSR / Donations', 'Per policy section 5.5', pt_exc_csr, v_currency_usd)
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 3, 'USER', NULL, u_pinkesh);
END $$;

COMMIT;
