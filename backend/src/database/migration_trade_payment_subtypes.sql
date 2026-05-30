-- =====================================================================
-- Payments Control System - Trade Payments sub-types + matrices
--
-- Per the policy's section 4 Payment Categories table, "Trade Payments"
-- is split into these sub-types:
--   - Supplier payments
--   - Advance payments
--   - Import payments (LC/BG)
--   - Margin payments for derivatives (exchange / broker margin calls)
--   - Payments to trade finance banks (margin top-ups, collateral
--     funding, LC margining)
--
-- All 5 sub-types share the same authority matrix from section 5.1
-- (4 bands: Ops Team Maker, Accounts Team Checker, Ganesh A1, Pinkesh A2).
-- Each gets its own payment_types row and its own approval_matrices row
-- so the matrices can later diverge without affecting the others.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Payment types - 5 new under "Trade Payments" category.
-- ---------------------------------------------------------------------
INSERT INTO payment_types (
    code, name, description, direction, requires_approval_chain, is_system,
    payment_category_id, maker_role_id, checker_role_id
)
SELECT v.code, v.name, v.description, 'OUTGOING', TRUE, TRUE,
       (SELECT id FROM payment_categories WHERE name = 'Trade Payments' AND deleted_at IS NULL),
       (SELECT id FROM roles WHERE code = 'OPS_TEAM'),
       (SELECT id FROM roles WHERE code = 'ACCOUNTS_TEAM')
FROM (VALUES
    ('SUPPLIER_PAYMENT',          'Supplier Payment',             'Trade supplier payment per policy section 4 + 5.1.'),
    ('ADVANCE_PAYMENT',           'Advance Payment',              'Advance payment to a trade counterparty per section 4 + 5.1.'),
    ('IMPORT_PAYMENT_LC_BG',      'Import Payment (LC/BG)',       'Import payment under Letter of Credit or Bank Guarantee per section 4 + 5.1.'),
    ('DERIVATIVE_MARGIN_PAYMENT', 'Derivative Margin Payment',    'Margin payment for derivatives (exchange / broker margin calls) per section 4 + 5.1.'),
    ('TRADE_FINANCE_PAYMENT',     'Trade Finance Bank Payment',   'Payment to trade finance bank (margin top-ups, collateral funding, LC margining) per section 4 + 5.1.')
) AS v(code, name, description);

-- ---------------------------------------------------------------------
-- 2) Approval matrices - one per new payment type, each mirroring the
--    section 5.1 4-band structure.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    v_currency_usd UUID;
    r_ops_team     UUID;
    r_accounts     UUID;
    u_ganesh       UUID;
    u_pinkesh      UUID;

    v_pt_code      TEXT;
    v_pt_id        UUID;
    v_matrix_id    UUID;
    v_band_id      UUID;
BEGIN
    SELECT id INTO v_currency_usd FROM currencies WHERE code = 'USD' LIMIT 1;
    SELECT id INTO r_ops_team    FROM roles WHERE code = 'OPS_TEAM';
    SELECT id INTO r_accounts    FROM roles WHERE code = 'ACCOUNTS_TEAM';
    SELECT id INTO u_ganesh      FROM users WHERE email = 'ganesh@radiant.com';
    SELECT id INTO u_pinkesh     FROM users WHERE email = 'pinkesh@radiant.com';

    FOREACH v_pt_code IN ARRAY ARRAY[
        'SUPPLIER_PAYMENT',
        'ADVANCE_PAYMENT',
        'IMPORT_PAYMENT_LC_BG',
        'DERIVATIVE_MARGIN_PAYMENT',
        'TRADE_FINANCE_PAYMENT'
    ] LOOP
        SELECT id INTO v_pt_id FROM payment_types WHERE code = v_pt_code;

        INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, published_at)
        VALUES (
            (SELECT name FROM payment_types WHERE id = v_pt_id) || ' - Authority Matrix',
            'Per policy section 5.1 (Trade Payments). Same 4-band chain across all bands.',
            v_pt_id, v_currency_usd, 'PUBLISHED', now()
        )
        RETURNING id INTO v_matrix_id;

        -- Band 1: 0 - 100,000
        INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
        VALUES (v_matrix_id, 1, 0, 100000) RETURNING id INTO v_band_id;
        INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
            (v_band_id, 1, 'ROLE', r_ops_team, NULL),
            (v_band_id, 2, 'ROLE', r_accounts, NULL),
            (v_band_id, 3, 'USER', NULL, u_ganesh),
            (v_band_id, 4, 'USER', NULL, u_pinkesh);

        -- Band 2: 100,001 - 500,000
        INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
        VALUES (v_matrix_id, 2, 100000.0001, 500000) RETURNING id INTO v_band_id;
        INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
            (v_band_id, 1, 'ROLE', r_ops_team, NULL),
            (v_band_id, 2, 'ROLE', r_accounts, NULL),
            (v_band_id, 3, 'USER', NULL, u_ganesh),
            (v_band_id, 4, 'USER', NULL, u_pinkesh);

        -- Band 3: 500,001 - 1,000,000
        INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
        VALUES (v_matrix_id, 3, 500000.0001, 1000000) RETURNING id INTO v_band_id;
        INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
            (v_band_id, 1, 'ROLE', r_ops_team, NULL),
            (v_band_id, 2, 'ROLE', r_accounts, NULL),
            (v_band_id, 3, 'USER', NULL, u_ganesh),
            (v_band_id, 4, 'USER', NULL, u_pinkesh);

        -- Band 4: above 1,000,000
        INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
        VALUES (v_matrix_id, 4, 1000000.0001, NULL) RETURNING id INTO v_band_id;
        INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_role_id, approver_user_id) VALUES
            (v_band_id, 1, 'ROLE', r_ops_team, NULL),
            (v_band_id, 2, 'ROLE', r_accounts, NULL),
            (v_band_id, 3, 'USER', NULL, u_ganesh),
            (v_band_id, 4, 'USER', NULL, u_pinkesh);
    END LOOP;
END $$;

COMMIT;
