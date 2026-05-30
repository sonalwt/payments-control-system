-- =====================================================================
-- Payments Control System — Authority Matrix seed (full-info-only)
--
-- Source: "Payments Authority Matrix - Radiant" policy document.
-- Inclusion rule: only matrix rows where every cell in the table is
-- populated. Excludes:
--   • Vendor Payments — Checker column entirely empty in the doc.
--   • Consultants / Corp Sec / Renewals — Checker + Approver 2 empty.
--   • Annual Subscriptions bands "Up to 1,000", "1,001–10,000",
--     "10,001–50,000" — Approver 2 cell empty. Only the "Above 50,000"
--     band has full info.
--
-- Two notes on the mapping:
--   • Annual Subscription Above 50k lists Approver 1 as "Tarang sir /
--     Ganesh Sir" (either). We pin it to Tarang as the primary; the
--     OR-semantics can be re-introduced later by promoting both to a
--     SUBSCRIPTION_APPROVERS role.
--   • Statutory Dues lists Approver as "Audit Team head". The current
--     role set does not include AUDIT_TEAM_HEAD; we use the generic
--     APPROVER role as a temporary placeholder.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Payment types — only those whose matrix has complete info.
-- ---------------------------------------------------------------------
INSERT INTO payment_types (
    code, name, description, direction, requires_approval_chain, is_system,
    payment_category_id, maker_role_id, checker_role_id
)
SELECT v.code, v.name, v.description, v.direction, TRUE, TRUE,
       (SELECT id FROM payment_categories WHERE name = v.category    AND deleted_at IS NULL),
       (SELECT id FROM roles              WHERE code = v.maker_code  AND deleted_at IS NULL),
       (SELECT id FROM roles              WHERE code = v.checker_code AND deleted_at IS NULL)
FROM (VALUES
    ('TRADE_PAYMENT',        'Trade Payment',                  'Trade payments (section 5.1).',                                  'OUTGOING', 'Trade Payments',       'OPS_TEAM',     'ACCOUNTS_TEAM'),
    ('TRAVEL_DESK',          'Travel Desk Payment',            'Non-trade travel desk payments (section 5.2). Maker/Checker are specific users.', 'OUTGOING', 'Non-Trade Payments', NULL, NULL),
    ('ANNUAL_SUBSCRIPTION',  'Annual Subscription',            'Trading platform subscriptions. Only "Above 50,000" band has complete info.', 'OUTGOING', 'Non-Trade Payments', 'TRADING_TEAM', 'ABHISHEK_TEAM'),
    ('SALARIES',             'Salaries',                       'Monthly salary payments (section 5.3).',                         'OUTGOING', 'Non-Trade Payments',   'HR',           'TREASURY_TEAM'),
    ('STATUTORY_DUES',       'Statutory Dues',                 'Statutory dues VAT/TDS (section 5.3).',                          'OUTGOING', 'Non-Trade Payments',   'ROHIT_TEAM',   'ACCOUNTS_TEAM'),
    ('RENT_UTIL_SG',         'Rent & Utilities - Singapore',   'Singapore office rent & utilities. Maker/Checker are specific users.', 'OUTGOING', 'Non-Trade Payments', NULL, NULL),
    ('RENT_UTIL_DXB',        'Rent & Utilities - Dubai',       'Dubai office rent & utilities. Maker/Checker are specific users.', 'OUTGOING', 'Non-Trade Payments', NULL, NULL),
    ('RENT_UTIL_GENEVA',     'Rent & Utilities - Geneva',      'Geneva office rent & utilities. Maker is a specific user.',       'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('RENT_UTIL_UK',         'Rent & Utilities - UK',          'UK office rent & utilities. Maker is a specific user.',           'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('RENT_UTIL_US',         'Rent & Utilities - US',          'US office rent & utilities. Maker is a specific user.',           'OUTGOING', 'Non-Trade Payments',   NULL,           'ABHISHEK_TEAM'),
    ('CAPEX',                'Capital Expenditure',            'Capex - single approver per band (section 5.4).',                'OUTGOING', 'Capital Expenditure',  NULL,           NULL),
    ('EXCEPTIONAL_MA',       'Exceptional - M&A',              'M&A transactions (section 5.5).',                                'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_RPT',      'Exceptional - Related Party',    'Related party transactions (section 5.5).',                      'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_LEGAL',    'Exceptional - Legal Settlement', 'Legal settlements (section 5.5).',                               'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_WRITEOFF', 'Exceptional - Write-off',        'Write-offs (section 5.5).',                                      'OUTGOING', 'Exceptional Payments', NULL,           NULL),
    ('EXCEPTIONAL_CSR',      'Exceptional - CSR / Donations',  'CSR and donations (section 5.5).',                               'OUTGOING', 'Exceptional Payments', NULL,           NULL)
) AS v(code, name, description, direction, category, maker_code, checker_code);

-- ---------------------------------------------------------------------
-- 2) Approval matrices + bands + steps
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
    r_rohit_team     UUID; r_approver       UUID;

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
    SELECT id INTO r_hr          FROM roles WHERE code = 'HR';
    SELECT id INTO r_trading     FROM roles WHERE code = 'TRADING_TEAM';
    SELECT id INTO r_abhishek    FROM roles WHERE code = 'ABHISHEK_TEAM';
    SELECT id INTO r_rohit_team  FROM roles WHERE code = 'ROHIT_TEAM';
    SELECT id INTO r_approver    FROM roles WHERE code = 'APPROVER';

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
    VALUES ('Trade Payments - Authority Matrix', 'Per policy section 5.1', pt_trade, v_currency_usd, 'PUBLISHED', now())
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
    VALUES ('Travel Desk - Authority Matrix', 'Per policy section 5.2', pt_travel, v_currency_usd, 'PUBLISHED', now())
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
    -- Annual Subscription - only the "Above 50,000" band has full info.
    -- Approver 1 listed as "Tarang sir / Ganesh Sir" - pinned to Tarang.
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Annual Subscription - Authority Matrix',
            'Per policy (Annual subscriptions, Above 50,000 band only - the band with complete information).',
            pt_subscription, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 50000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_trading,  NULL),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang),
        (v_band_id, 4, 'USER', NULL,       u_pinkesh);

    -- =================================================================
    -- 5.3 Salaries (single band, any amount)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Salaries - Authority Matrix', 'Per policy section 5.3', pt_salaries, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_hr,       NULL),
        (v_band_id, 2, 'ROLE', r_treasury, NULL),
        (v_band_id, 3, 'USER', NULL,       u_ganesh);

    -- =================================================================
    -- 5.3 Statutory Dues - Approver listed as "Audit Team head" in doc.
    -- Mapped to APPROVER role here as a temporary placeholder.
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Statutory Dues - Authority Matrix',
            'Per policy section 5.3 (VAT, TDS). Approver mapped to generic APPROVER role in lieu of AUDIT_TEAM_HEAD.',
            pt_statutory, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'ROLE', r_rohit_team, NULL),
        (v_band_id, 2, 'ROLE', r_accounts,   NULL),
        (v_band_id, 3, 'ROLE', r_approver,   NULL);

    -- =================================================================
    -- 5.3 Rent & Utilities - Singapore (Magaeshwari/Magaeshwari/Ganesh)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities - Singapore Office', 'Per policy section 5.3', pt_rent_sg, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_magaeshwari),
        (v_band_id, 2, 'USER', NULL, u_magaeshwari),
        (v_band_id, 3, 'USER', NULL, u_ganesh);

    -- =================================================================
    -- 5.3 Rent & Utilities - Dubai (Shivam/Shivam/Mr Ali)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities - Dubai Office', 'Per policy section 5.3', pt_rent_dxb, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL, u_shivam),
        (v_band_id, 2, 'USER', NULL, u_shivam),
        (v_band_id, 3, 'USER', NULL, u_ali);

    -- =================================================================
    -- 5.3 Rent & Utilities - Geneva (Ghizlane/Abhishek Team/Tarang)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities - Geneva Office', 'Per policy section 5.3', pt_rent_geneva, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_ghizlane),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- =================================================================
    -- 5.3 Rent & Utilities - UK (Saritha/Abhishek Team/Tarang)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities - UK Office', 'Per policy section 5.3', pt_rent_uk, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_saritha),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- =================================================================
    -- 5.3 Rent & Utilities - US (Saritha/Abhishek Team/Tarang)
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Rent & Utilities - US Office', 'Per policy section 5.3', pt_rent_us, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
        (v_band_id, 1, 'USER', NULL,       u_saritha),
        (v_band_id, 2, 'ROLE', r_abhishek, NULL),
        (v_band_id, 3, 'USER', NULL,       u_tarang);

    -- =================================================================
    -- 5.4 Capex - 3 bands, single approver (Pinkesh) per band.
    -- Complete per the doc's own single-column "Approval Levels" format.
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Capital Expenditure - Authority Matrix', 'Per policy section 5.4', pt_capex, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, 50000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 2, 50000.0001, 200000) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 3, 200000.0001, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    -- =================================================================
    -- 5.5 Exceptional Payments - single approver (Pinkesh) per matrix.
    -- Complete per the doc's own "Approval Requirement" format.
    -- =================================================================
    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional - M&A', 'Per policy section 5.5', pt_exc_ma, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional - Related Party', 'Per policy section 5.5', pt_exc_rpt, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional - Legal Settlement', 'Per policy section 5.5', pt_exc_legal, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional - Write-off', 'Per policy section 5.5', pt_exc_writeoff, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);

    INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
    VALUES ('Exceptional - CSR / Donations', 'Per policy section 5.5', pt_exc_csr, v_currency_usd, 'PUBLISHED', now())
    RETURNING id INTO v_matrix_id;
    INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount) VALUES (v_matrix_id, 1, 0, NULL) RETURNING id INTO v_band_id;
    INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES (v_band_id, 1, 'USER', NULL, u_pinkesh);
END $$;

COMMIT;
