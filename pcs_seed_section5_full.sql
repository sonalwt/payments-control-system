SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================
-- 1. Helper roles needed to model PDF section 5 OR-patterns
--    and the Audit Team head approver
-- ============================================================
INSERT INTO roles (code, name, description, is_system) VALUES
  ('VENDOR_PAYMENT_APPROVERS', 'Vendor Payment Approvers',  'PDF section 5 Vendor Payments approver pool: Ganesh / Mr Ali', FALSE),
  ('CONSULTANTS_MAKERS',       'Consultants Makers',        'PDF section 5 Consultants maker pool (6 users)',               FALSE),
  ('CONSULTANT_APPROVERS',     'Consultant Approvers',      'PDF section 5 Consultants approver pool: Lalit / Harit / Mr Ali', FALSE),
  ('AUDIT_TEAM_HEAD',          'Audit Team Head',           'PDF section 5.3 Statutory Dues approver',                       FALSE);

-- ============================================================
-- 2. Memberships for the helper roles
-- ============================================================
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN (VALUES
  -- Vendor payment approvers
  ('ganesh@radiant.com',    'VENDOR_PAYMENT_APPROVERS'),
  ('ali@radiant.com',       'VENDOR_PAYMENT_APPROVERS'),
  -- Consultants makers
  ('saritha@radiant.com',   'CONSULTANTS_MAKERS'),
  ('pritesh@radiant.com',   'CONSULTANTS_MAKERS'),
  ('sandip@radiant.com',    'CONSULTANTS_MAKERS'),
  ('rohit@radiant.com',     'CONSULTANTS_MAKERS'),
  ('vinayak@radiant.com',   'CONSULTANTS_MAKERS'),
  ('priyanka@radiant.com',  'CONSULTANTS_MAKERS'),
  -- Consultant approvers
  ('lalit@radiant.com',     'CONSULTANT_APPROVERS'),
  ('harit@radiant.com',     'CONSULTANT_APPROVERS'),
  ('ali@radiant.com',       'CONSULTANT_APPROVERS')
) AS x(email, role_code)        ON u.email = x.email
JOIN roles r                    ON r.code  = x.role_code;

-- ============================================================
-- 3. Payment categories (PDF section 4)
-- ============================================================
INSERT INTO payment_categories (name) VALUES
  ('Trade Payments'),
  ('Non-Trade Payments'),
  ('Capital Expenditure'),
  ('Exceptional Payments');

-- ============================================================
-- 4. Payment types (22 per PDF section 5)
-- ============================================================
INSERT INTO payment_types
  (code, name, description, direction, payment_category_id, maker_role_id, checker_role_id, maker_user_id, checker_user_id, is_system, is_active)
SELECT
  v.code, v.name, v.description, v.direction,
  (SELECT id FROM payment_categories WHERE name = v.category),
  CASE WHEN v.maker_role   IS NOT NULL THEN (SELECT id FROM roles WHERE code = v.maker_role)   END,
  CASE WHEN v.checker_role IS NOT NULL THEN (SELECT id FROM roles WHERE code = v.checker_role) END,
  CASE WHEN v.maker_user   IS NOT NULL THEN (SELECT id FROM users WHERE email = v.maker_user)  END,
  CASE WHEN v.checker_user IS NOT NULL THEN (SELECT id FROM users WHERE email = v.checker_user) END,
  TRUE, TRUE
FROM (VALUES
  -- 5.1 Trade Payments (5) - Ops Team maker, Accounts Team checker
  ('SUPPLIER_PAYMENT',          'Supplier Payment',                 'PDF 5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  ('ADVANCE_PAYMENT',           'Advance Payment',                  'PDF 5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  ('IMPORT_PAYMENT_LC_BG',      'Import Payment (LC/BG)',           'PDF 5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  ('DERIVATIVE_MARGIN_PAYMENT', 'Derivative Margin Payment',        'PDF 5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  ('TRADE_FINANCE_PAYMENT',     'Trade Finance Bank Payment',       'PDF 5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  -- 5.2 Travel Desk - Venessa maker, Sachin checker
  ('TRAVEL_DESK',               'Travel Desk Payment',              'PDF 5.2 Travel Desk',                   'OUTGOING', 'Non-Trade Payments', NULL,           NULL,           'venessa@radiant.com','sachin@radiant.com'),
  -- 5 Vendor Payments - Ops Team pool, no checker
  ('VENDOR_PAYMENT',            'Vendor Payments',                  'PDF 5 Non-Trade Vendor Payments',       'OUTGOING', 'Non-Trade Payments', 'OPS_TEAM',     NULL,            NULL, NULL),
  -- 5 Annual Subscription - Trading Team maker, Abhishek Team checker
  ('ANNUAL_SUBSCRIPTION',       'Annual Subscription',              'PDF 5 Annual Subscription Trading Platforms','OUTGOING','Non-Trade Payments','TRADING_TEAM','ABHISHEK_TEAM', NULL, NULL),
  -- 5 Consultants - pool of 6, no checker
  ('CONSULTANTS_CORPSEC',       'Consultants, Corp Sec, Renewals',  'PDF 5 Non-Trade Consultants',           'OUTGOING', 'Non-Trade Payments', 'CONSULTANTS_MAKERS', NULL, NULL, NULL),
  -- 5.3 Salaries, Statutory, Rent
  ('SALARIES',                  'Salaries',                         'PDF 5.3 Salaries',                      'OUTGOING', 'Non-Trade Payments', 'HR',           'TREASURY_TEAM', NULL, NULL),
  ('STATUTORY_DUES',            'Statutory Dues',                   'PDF 5.3 Statutory Dues (VAT/TDS)',      'OUTGOING', 'Non-Trade Payments', 'ROHIT_TEAM',   'ACCOUNTS_TEAM', NULL, NULL),
  ('RENT_UTIL_SG',              'Rent and Utilities - Singapore',   'PDF 5.3 Rent SG (Magaeshwari)',         'OUTGOING', 'Non-Trade Payments', NULL,           NULL,           'magaeshwari@radiant.com','magaeshwari@radiant.com'),
  ('RENT_UTIL_DXB',             'Rent and Utilities - Dubai',       'PDF 5.3 Rent DXB (Shivam)',             'OUTGOING', 'Non-Trade Payments', NULL,           NULL,           'shivam@radiant.com','shivam@radiant.com'),
  ('RENT_UTIL_GENEVA',          'Rent and Utilities - Geneva',      'PDF 5.3 Rent Geneva (Ghizlane)',        'OUTGOING', 'Non-Trade Payments', NULL,           'ABHISHEK_TEAM','ghizlane@radiant.com', NULL),
  ('RENT_UTIL_UK',              'Rent and Utilities - UK',          'PDF 5.3 Rent UK (Saritha)',             'OUTGOING', 'Non-Trade Payments', NULL,           'ABHISHEK_TEAM','saritha@radiant.com',  NULL),
  ('RENT_UTIL_US',              'Rent and Utilities - US',          'PDF 5.3 Rent US (Saritha)',             'OUTGOING', 'Non-Trade Payments', NULL,           'ABHISHEK_TEAM','saritha@radiant.com',  NULL),
  -- 5.4 Capex
  ('CAPEX',                     'Capital Expenditure',              'PDF 5.4 Capex',                         'OUTGOING', 'Capital Expenditure',NULL,           NULL,            NULL, NULL),
  -- 5.5 Exceptional (5)
  ('EXCEPTIONAL_MA',            'Exceptional - M&A',                'PDF 5.5 M&A',                           'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL),
  ('EXCEPTIONAL_RPT',           'Exceptional - Related Party',      'PDF 5.5 Related Party',                 'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL),
  ('EXCEPTIONAL_LEGAL',         'Exceptional - Legal Settlement',   'PDF 5.5 Legal Settlement',              'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL),
  ('EXCEPTIONAL_WRITEOFF',      'Exceptional - Write-off',          'PDF 5.5 Write-off',                     'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL),
  ('EXCEPTIONAL_CSR',           'Exceptional - CSR / Donations',    'PDF 5.5 CSR / Donations',               'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL)
) AS v(code, name, description, direction, category, maker_role, checker_role, maker_user, checker_user);

-- ============================================================
-- 5. Approval matrices: 1 per payment type, all USD
-- ============================================================
INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, effective_from, published_at)
SELECT pt.name || ' - Authority Matrix',
       'Per PDF section 5',
       pt.id,
       (SELECT id FROM currencies WHERE code = 'USD'),
       'PUBLISHED', CURRENT_DATE, now()
FROM payment_types pt;

-- ============================================================
-- 6. Approval matrix bands
-- ============================================================
-- 5.1 Trade - 4 bands
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,             100000::numeric),
  (2, 100000.0001::numeric,   500000::numeric),
  (3, 500000.0001::numeric,  1000000::numeric),
  (4, 1000000.0001::numeric, NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code IN ('SUPPLIER_PAYMENT','ADVANCE_PAYMENT','IMPORT_PAYMENT_LC_BG','DERIVATIVE_MARGIN_PAYMENT','TRADE_FINANCE_PAYMENT');

-- 5.2 Travel Desk - 3 bands
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,          1000::numeric),
  (2, 1000.0001::numeric, 10000::numeric),
  (3, 10000.0001::numeric, 25000::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'TRAVEL_DESK';

-- Vendor Payments - 4 bands
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,            1000::numeric),
  (2, 1000.0001::numeric,   10000::numeric),
  (3, 10000.0001::numeric,  25000::numeric),
  (4, 25000.0001::numeric,  NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'VENDOR_PAYMENT';

-- Annual Subscription - 4 bands
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,            1000::numeric),
  (2, 1000.0001::numeric,   10000::numeric),
  (3, 10000.0001::numeric,  50000::numeric),
  (4, 50000.0001::numeric,  NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'ANNUAL_SUBSCRIPTION';

-- Consultants - 4 bands
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,            1000::numeric),
  (2, 1000.0001::numeric,   10000::numeric),
  (3, 10000.0001::numeric,  50000::numeric),
  (4, 50000.0001::numeric,  NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'CONSULTANTS_CORPSEC';

-- 5.3 Salaries / Statutory / Rent - 1 band each
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, 1, 0::numeric, NULL::numeric
FROM approval_matrices m JOIN payment_types pt ON pt.id = m.payment_type_id
WHERE pt.code IN ('SALARIES','STATUTORY_DUES','RENT_UTIL_SG','RENT_UTIL_DXB','RENT_UTIL_GENEVA','RENT_UTIL_UK','RENT_UTIL_US');

-- 5.4 Capex - 3 bands
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,           50000::numeric),
  (2, 50000.0001::numeric, 200000::numeric),
  (3, 200000.0001::numeric, NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'CAPEX';

-- 5.5 Exceptional - 1 band each
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, 1, 0::numeric, NULL::numeric
FROM approval_matrices m JOIN payment_types pt ON pt.id = m.payment_type_id
WHERE pt.code IN ('EXCEPTIONAL_MA','EXCEPTIONAL_RPT','EXCEPTIONAL_LEGAL','EXCEPTIONAL_WRITEOFF','EXCEPTIONAL_CSR');

-- ============================================================
-- 7. Approval matrix steps
-- ============================================================
-- 5.1 Trade - every band: ACCOUNTS_TEAM (checker), Ganesh, Pinkesh
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, s.atype,
       CASE WHEN s.atype = 'USER' THEN (SELECT id FROM users WHERE email = s.ident) END,
       CASE WHEN s.atype = 'ROLE' THEN (SELECT id FROM roles WHERE code  = s.ident) END
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 'ROLE'::text, 'ACCOUNTS_TEAM'),
  (2, 'USER'::text, 'ganesh@radiant.com'),
  (3, 'USER'::text, 'pinkesh@radiant.com')
) AS s(step_order, atype, ident)
WHERE pt.code IN ('SUPPLIER_PAYMENT','ADVANCE_PAYMENT','IMPORT_PAYMENT_LC_BG','DERIVATIVE_MARGIN_PAYMENT','TRADE_FINANCE_PAYMENT');

-- 5.2 Travel Desk - every band: Sachin, Sachin, Pinkesh
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, 'USER',
       (SELECT id FROM users WHERE email = s.email), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 'sachin@radiant.com'),
  (2, 'sachin@radiant.com'),
  (3, 'pinkesh@radiant.com')
) AS s(step_order, email)
WHERE pt.code = 'TRAVEL_DESK';

-- Vendor Payments - bands 1-3: VENDOR_PAYMENT_APPROVERS only; band 4: + Pinkesh
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 1, 'ROLE', NULL, (SELECT id FROM roles WHERE code = 'VENDOR_PAYMENT_APPROVERS')
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code = 'VENDOR_PAYMENT';

INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 2, 'USER', (SELECT id FROM users WHERE email = 'pinkesh@radiant.com'), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code = 'VENDOR_PAYMENT' AND b.sort_order = 4;

-- Annual Subscription - every band: ABHISHEK_TEAM, Tarang; band 4: + Pinkesh
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, s.atype,
       CASE WHEN s.atype = 'USER' THEN (SELECT id FROM users WHERE email = s.ident) END,
       CASE WHEN s.atype = 'ROLE' THEN (SELECT id FROM roles WHERE code  = s.ident) END
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 'ROLE'::text, 'ABHISHEK_TEAM'),
  (2, 'USER'::text, 'tarang@radiant.com')
) AS s(step_order, atype, ident)
WHERE pt.code = 'ANNUAL_SUBSCRIPTION';

INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 3, 'USER', (SELECT id FROM users WHERE email = 'pinkesh@radiant.com'), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code = 'ANNUAL_SUBSCRIPTION' AND b.sort_order = 4;

-- Consultants - every band: CONSULTANT_APPROVERS only
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 1, 'ROLE', NULL, (SELECT id FROM roles WHERE code = 'CONSULTANT_APPROVERS')
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code = 'CONSULTANTS_CORPSEC';

-- 5.3 SALARIES - TREASURY_TEAM (checker), Ganesh
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, s.atype,
       CASE WHEN s.atype = 'USER' THEN (SELECT id FROM users WHERE email = s.ident) END,
       CASE WHEN s.atype = 'ROLE' THEN (SELECT id FROM roles WHERE code  = s.ident) END
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 'ROLE'::text, 'TREASURY_TEAM'),
  (2, 'USER'::text, 'ganesh@radiant.com')
) AS s(step_order, atype, ident)
WHERE pt.code = 'SALARIES';

-- 5.3 STATUTORY_DUES - ACCOUNTS_TEAM (checker), AUDIT_TEAM_HEAD
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, 'ROLE', NULL,
       (SELECT id FROM roles WHERE code = s.role_code)
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 'ACCOUNTS_TEAM'),
  (2, 'AUDIT_TEAM_HEAD')
) AS s(step_order, role_code)
WHERE pt.code = 'STATUTORY_DUES';

-- 5.3 RENT SG - Magaeshwari (checker), Ganesh
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, 'USER', (SELECT id FROM users WHERE email = s.email), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 'magaeshwari@radiant.com'),
  (2, 'ganesh@radiant.com')
) AS s(step_order, email)
WHERE pt.code = 'RENT_UTIL_SG';

-- 5.3 RENT DXB - Shivam (checker), Ali
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, 'USER', (SELECT id FROM users WHERE email = s.email), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 'shivam@radiant.com'),
  (2, 'ali@radiant.com')
) AS s(step_order, email)
WHERE pt.code = 'RENT_UTIL_DXB';

-- 5.3 RENT Geneva/UK/US - ABHISHEK_TEAM (checker), Tarang
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, s.atype,
       CASE WHEN s.atype = 'USER' THEN (SELECT id FROM users WHERE email = s.ident) END,
       CASE WHEN s.atype = 'ROLE' THEN (SELECT id FROM roles WHERE code  = s.ident) END
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 'ROLE'::text, 'ABHISHEK_TEAM'),
  (2, 'USER'::text, 'tarang@radiant.com')
) AS s(step_order, atype, ident)
WHERE pt.code IN ('RENT_UTIL_GENEVA','RENT_UTIL_UK','RENT_UTIL_US');

-- 5.4 Capex - every band: Pinkesh only
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 1, 'USER', (SELECT id FROM users WHERE email = 'pinkesh@radiant.com'), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code = 'CAPEX';

-- 5.5 Exceptional - every band: Pinkesh only
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 1, 'USER', (SELECT id FROM users WHERE email = 'pinkesh@radiant.com'), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code IN ('EXCEPTIONAL_MA','EXCEPTIONAL_RPT','EXCEPTIONAL_LEGAL','EXCEPTIONAL_WRITEOFF','EXCEPTIONAL_CSR');

COMMIT;

SELECT 'roles' AS tbl, count(*) FROM roles
UNION ALL SELECT 'user_roles', count(*) FROM user_roles
UNION ALL SELECT 'payment_categories', count(*) FROM payment_categories
UNION ALL SELECT 'payment_types', count(*) FROM payment_types
UNION ALL SELECT 'approval_matrices', count(*) FROM approval_matrices
UNION ALL SELECT 'approval_matrix_bands', count(*) FROM approval_matrix_bands
UNION ALL SELECT 'approval_matrix_steps', count(*) FROM approval_matrix_steps;
