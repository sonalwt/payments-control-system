SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================
-- 1. Wipe users + roles (cascade will also wipe user_roles,
--    payment_types, approval_matrices/bands/steps,
--    payment_requests/approvals/documents, bene change requests)
-- ============================================================
TRUNCATE users, roles CASCADE;

-- ============================================================
-- 2. Roles (15) — generic + PDF teams + helper maker/approver pools
-- ============================================================
INSERT INTO roles (code, name, description, is_system) VALUES
  ('SUPER_ADMIN',                'Super Admin',               'Platform administrator',                                          TRUE),
  ('COUNTERPARTY',               'Counterparty',              'External counterparty-portal user',                                TRUE),
  ('APPROVER',                   'Approver',                  'Financial authorisation per the authority matrix',                FALSE),
  ('OPS_TEAM',                   'Ops Team',                  'Maker - Trade Payments (PDF 5.1)',                                FALSE),
  ('ACCOUNTS_TEAM',              'Accounts Team',             'Checker - Trade Payments, Statutory Dues',                        FALSE),
  ('TRADING_TEAM',               'Trading Team',              'Maker - Annual Subscription trading platforms',                   FALSE),
  ('ABHISHEK_TEAM',              'Abhishek Team',             'Checker - Annual Subscription, Rent Geneva/UK/US',                FALSE),
  ('HR',                         'HR',                        'Maker - Salaries (PDF 5.3)',                                      FALSE),
  ('ROHIT_TEAM',                 'Rohit Team',                'Maker - Statutory Dues (PDF 5.3)',                                FALSE),
  ('TREASURY_TEAM',              'Treasury Team',             'Checker - Salaries (PDF 5.3); bank execution',                    FALSE),
  ('AUDIT_TEAM_HEAD',            'Audit Team Head',           'Approver - Statutory Dues (PDF 5.3)',                             FALSE),
  ('VENDOR_PAYMENT_MAKERS',      'Vendor Payment Makers',     'Maker pool - PDF 5 Vendor Payments',                              FALSE),
  ('VENDOR_PAYMENT_APPROVERS',   'Vendor Payment Approvers',  'Approver pool - Ganesh / Mr Ali',                                 FALSE),
  ('CONSULTANTS_MAKERS',         'Consultants Makers',        'Maker pool - PDF 5 Consultants / Corp Sec / Renewals',            FALSE),
  ('CONSULTANT_APPROVERS',       'Consultant Approvers',      'Approver pool - Lalit / Harit / Mr Ali',                          FALSE);

-- ============================================================
-- 3. Users (25) — admin + 24 named individuals from PDF
--    Password for all: Radiant@1234
-- ============================================================
INSERT INTO users (email, password_hash, full_name, is_active, is_platform_admin) VALUES
  ('admin@radiant.com',         '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Admin',         TRUE, TRUE ),
  ('ganesh@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Ganesh',        TRUE, FALSE),
  ('pinkesh@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Pinkesh',       TRUE, FALSE),
  ('venessa@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Venessa',       TRUE, FALSE),
  ('sachin@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Sachin',        TRUE, FALSE),
  ('tarang@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Tarang',        TRUE, FALSE),
  ('ali@radiant.com',           '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Mr Ali',        TRUE, FALSE),
  ('lalit@radiant.com',         '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Lalit',         TRUE, FALSE),
  ('harit@radiant.com',         '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Harit',         TRUE, FALSE),
  ('shivam@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Shivam',        TRUE, FALSE),
  ('magaeshwari@radiant.com',   '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Magaeshwari',   TRUE, FALSE),
  ('saritha@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Saritha',       TRUE, FALSE),
  ('ghizlane@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Ghizlane',      TRUE, FALSE),
  ('mark@radiant.com',          '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Mark',          TRUE, FALSE),
  ('shoaib@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Shoaib',        TRUE, FALSE),
  ('richard@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Richard',       TRUE, FALSE),
  ('pritesh@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Pritesh',       TRUE, FALSE),
  ('shivshakthi@radiant.com',   '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Shiv Shakthi',  TRUE, FALSE),
  ('nilesh@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Nilesh',        TRUE, FALSE),
  ('vinayak@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Vinayak',       TRUE, FALSE),
  ('ahmad@radiant.com',         '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Ahmad',         TRUE, FALSE),
  ('asmita@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Asmita',        TRUE, FALSE),
  ('sandip@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Sandip',        TRUE, FALSE),
  ('priyanka@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Priyanka',      TRUE, FALSE),
  ('rohit@radiant.com',         '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Rohit',         TRUE, FALSE);

-- ============================================================
-- 4. User -> Role assignments (per PDF §5)
-- ============================================================
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN (VALUES
  -- admin
  ('admin@radiant.com',        'SUPER_ADMIN'),
  -- approvers
  ('ganesh@radiant.com',       'APPROVER'),
  ('pinkesh@radiant.com',      'APPROVER'),
  ('sachin@radiant.com',       'APPROVER'),
  ('tarang@radiant.com',       'APPROVER'),
  ('ali@radiant.com',          'APPROVER'),
  ('lalit@radiant.com',        'APPROVER'),
  ('harit@radiant.com',        'APPROVER'),
  -- Vendor Payment approver pool (Ganesh / Mr Ali)
  ('ganesh@radiant.com',       'VENDOR_PAYMENT_APPROVERS'),
  ('ali@radiant.com',          'VENDOR_PAYMENT_APPROVERS'),
  -- Consultant approver pool (Lalit / Harit / Mr Ali)
  ('lalit@radiant.com',        'CONSULTANT_APPROVERS'),
  ('harit@radiant.com',        'CONSULTANT_APPROVERS'),
  ('ali@radiant.com',          'CONSULTANT_APPROVERS'),
  -- Vendor Payment maker pool (14 users per PDF)
  ('shivam@radiant.com',       'VENDOR_PAYMENT_MAKERS'),
  ('magaeshwari@radiant.com',  'VENDOR_PAYMENT_MAKERS'),
  ('saritha@radiant.com',      'VENDOR_PAYMENT_MAKERS'),
  ('ghizlane@radiant.com',     'VENDOR_PAYMENT_MAKERS'),
  ('venessa@radiant.com',      'VENDOR_PAYMENT_MAKERS'),
  ('mark@radiant.com',         'VENDOR_PAYMENT_MAKERS'),
  ('shoaib@radiant.com',       'VENDOR_PAYMENT_MAKERS'),
  ('richard@radiant.com',      'VENDOR_PAYMENT_MAKERS'),
  ('pritesh@radiant.com',      'VENDOR_PAYMENT_MAKERS'),
  ('shivshakthi@radiant.com',  'VENDOR_PAYMENT_MAKERS'),
  ('nilesh@radiant.com',       'VENDOR_PAYMENT_MAKERS'),
  ('vinayak@radiant.com',      'VENDOR_PAYMENT_MAKERS'),
  ('ahmad@radiant.com',        'VENDOR_PAYMENT_MAKERS'),
  ('asmita@radiant.com',       'VENDOR_PAYMENT_MAKERS'),
  -- Consultants maker pool (6 users per PDF)
  ('saritha@radiant.com',      'CONSULTANTS_MAKERS'),
  ('pritesh@radiant.com',      'CONSULTANTS_MAKERS'),
  ('sandip@radiant.com',       'CONSULTANTS_MAKERS'),
  ('rohit@radiant.com',        'CONSULTANTS_MAKERS'),
  ('vinayak@radiant.com',      'CONSULTANTS_MAKERS'),
  ('priyanka@radiant.com',     'CONSULTANTS_MAKERS')
) AS x(email, role_code)        ON u.email = x.email
JOIN roles r                    ON r.code  = x.role_code;

-- ============================================================
-- 5. Payment types (22 per PDF §5)
-- ============================================================
INSERT INTO payment_types
  (code, name, description, direction, payment_category_id, maker_role_id, checker_role_id, maker_user_id, checker_user_id, is_system, is_active)
SELECT
  v.code, v.name, v.description, v.direction,
  (SELECT id FROM payment_categories WHERE name = v.category),
  CASE WHEN v.maker_role  IS NOT NULL THEN (SELECT id FROM roles WHERE code = v.maker_role)  END,
  CASE WHEN v.checker_role IS NOT NULL THEN (SELECT id FROM roles WHERE code = v.checker_role) END,
  CASE WHEN v.maker_user  IS NOT NULL THEN (SELECT id FROM users WHERE email = v.maker_user)  END,
  CASE WHEN v.checker_user IS NOT NULL THEN (SELECT id FROM users WHERE email = v.checker_user) END,
  TRUE, TRUE
FROM (VALUES
  -- §5.1 Trade Payments (5) — maker = OPS_TEAM, checker = ACCOUNTS_TEAM
  ('SUPPLIER_PAYMENT',          'Supplier Payment',                 'PDF §5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  ('ADVANCE_PAYMENT',           'Advance Payment',                  'PDF §5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  ('IMPORT_PAYMENT_LC_BG',      'Import Payment (LC/BG)',           'PDF §5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  ('DERIVATIVE_MARGIN_PAYMENT', 'Derivative Margin Payment',        'PDF §5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  ('TRADE_FINANCE_PAYMENT',     'Trade Finance Bank Payment',       'PDF §5.1 Trade Payments',                'OUTGOING', 'Trade Payments',     'OPS_TEAM',     'ACCOUNTS_TEAM', NULL, NULL),
  -- §5.2 Travel Desk — maker = Venessa, checker = Sachin
  ('TRAVEL_DESK',               'Travel Desk Payment',              'PDF §5.2 Travel Desk',                   'OUTGOING', 'Non-Trade Payments', NULL,           NULL,           'venessa@radiant.com','sachin@radiant.com'),
  -- §5.x Vendor Payments — maker = pool, no checker
  ('VENDOR_PAYMENT',            'Vendor Payments',                  'PDF §5 Non-Trade Vendor Payments',       'OUTGOING', 'Non-Trade Payments', 'VENDOR_PAYMENT_MAKERS', NULL, NULL, NULL),
  -- §5.x Annual Subscriptions — maker = TRADING_TEAM, checker = ABHISHEK_TEAM
  ('ANNUAL_SUBSCRIPTION',       'Annual Subscription',              'PDF §5 Annual Subscription Trading Platforms','OUTGOING','Non-Trade Payments','TRADING_TEAM','ABHISHEK_TEAM', NULL, NULL),
  -- §5.x Consultants — maker = pool, no checker
  ('CONSULTANTS_CORPSEC',       'Consultants, Corp Sec, Renewals',  'PDF §5 Non-Trade Consultants',           'OUTGOING', 'Non-Trade Payments', 'CONSULTANTS_MAKERS', NULL, NULL, NULL),
  -- §5.3 Salaries / Statutory / Rent
  ('SALARIES',                  'Salaries',                         'PDF §5.3 Salaries',                      'OUTGOING', 'Non-Trade Payments', 'HR',           'TREASURY_TEAM', NULL, NULL),
  ('STATUTORY_DUES',            'Statutory Dues',                   'PDF §5.3 Statutory Dues (VAT/TDS)',      'OUTGOING', 'Non-Trade Payments', 'ROHIT_TEAM',   'ACCOUNTS_TEAM', NULL, NULL),
  ('RENT_UTIL_SG',              'Rent & Utilities - Singapore',     'PDF §5.3 Rent SG (Magaeshwari)',         'OUTGOING', 'Non-Trade Payments', NULL,           NULL,           'magaeshwari@radiant.com','magaeshwari@radiant.com'),
  ('RENT_UTIL_DXB',             'Rent & Utilities - Dubai',         'PDF §5.3 Rent DXB (Shivam)',             'OUTGOING', 'Non-Trade Payments', NULL,           NULL,           'shivam@radiant.com','shivam@radiant.com'),
  ('RENT_UTIL_GENEVA',          'Rent & Utilities - Geneva',        'PDF §5.3 Rent Geneva (Ghizlane)',        'OUTGOING', 'Non-Trade Payments', NULL,           'ABHISHEK_TEAM','ghizlane@radiant.com', NULL),
  ('RENT_UTIL_UK',              'Rent & Utilities - UK',            'PDF §5.3 Rent UK (Saritha)',             'OUTGOING', 'Non-Trade Payments', NULL,           'ABHISHEK_TEAM','saritha@radiant.com',  NULL),
  ('RENT_UTIL_US',              'Rent & Utilities - US',            'PDF §5.3 Rent US (Saritha)',             'OUTGOING', 'Non-Trade Payments', NULL,           'ABHISHEK_TEAM','saritha@radiant.com',  NULL),
  -- §5.4 Capex
  ('CAPEX',                     'Capital Expenditure',              'PDF §5.4 Capex',                         'OUTGOING', 'Capital Expenditure',NULL,           NULL,            NULL, NULL),
  -- §5.5 Exceptional (5)
  ('EXCEPTIONAL_MA',            'Exceptional - M&A',                'PDF §5.5 M&A',                           'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL),
  ('EXCEPTIONAL_RPT',           'Exceptional - Related Party',      'PDF §5.5 Related Party',                 'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL),
  ('EXCEPTIONAL_LEGAL',         'Exceptional - Legal Settlement',   'PDF §5.5 Legal Settlement',              'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL),
  ('EXCEPTIONAL_WRITEOFF',      'Exceptional - Write-off',          'PDF §5.5 Write-off',                     'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL),
  ('EXCEPTIONAL_CSR',           'Exceptional - CSR / Donations',    'PDF §5.5 CSR / Donations',               'OUTGOING', 'Exceptional Payments', NULL, NULL, NULL, NULL)
) AS v(code, name, description, direction, category, maker_role, checker_role, maker_user, checker_user);

-- ============================================================
-- 6. Approval matrices — one per payment type, all USD
-- ============================================================
INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, status, effective_from, published_at)
SELECT pt.name || ' - Authority Matrix',
       'Per PDF §5',
       pt.id,
       (SELECT id FROM currencies WHERE code = 'USD'),
       'PUBLISHED', CURRENT_DATE, now()
FROM payment_types pt;

-- ============================================================
-- 7. Approval matrix bands
-- ============================================================
-- §5.1 Trade Payments — 4 bands (0-100K / 100K-500K / 500K-1M / 1M+)
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m
JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,             100000::numeric),
  (2, 100000.0001::numeric,   500000::numeric),
  (3, 500000.0001::numeric,  1000000::numeric),
  (4, 1000000.0001::numeric, NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code IN ('SUPPLIER_PAYMENT','ADVANCE_PAYMENT','IMPORT_PAYMENT_LC_BG','DERIVATIVE_MARGIN_PAYMENT','TRADE_FINANCE_PAYMENT');

-- §5.2 Travel Desk — 3 bands (0-1K / 1K-10K / 10K-25K)
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m
JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,          1000::numeric),
  (2, 1000.0001::numeric, 10000::numeric),
  (3, 10000.0001::numeric, 25000::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'TRAVEL_DESK';

-- Vendor Payments — 4 bands (0-1K / 1K-10K / 10K-25K / 25K+)
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m
JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,            1000::numeric),
  (2, 1000.0001::numeric,   10000::numeric),
  (3, 10000.0001::numeric,  25000::numeric),
  (4, 25000.0001::numeric,  NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'VENDOR_PAYMENT';

-- Annual Subscriptions — 4 bands (0-1K / 1K-10K / 10K-50K / 50K+)
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m
JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,            1000::numeric),
  (2, 1000.0001::numeric,   10000::numeric),
  (3, 10000.0001::numeric,  50000::numeric),
  (4, 50000.0001::numeric,  NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'ANNUAL_SUBSCRIPTION';

-- Consultants — 4 bands (0-1K / 1K-10K / 10K-50K / 50K+)
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m
JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,            1000::numeric),
  (2, 1000.0001::numeric,   10000::numeric),
  (3, 10000.0001::numeric,  50000::numeric),
  (4, 50000.0001::numeric,  NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'CONSULTANTS_CORPSEC';

-- §5.3 Salaries / Statutory / Rent — single band each (0 to infinity)
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, 1, 0::numeric, NULL::numeric
FROM approval_matrices m
JOIN payment_types pt ON pt.id = m.payment_type_id
WHERE pt.code IN ('SALARIES','STATUTORY_DUES','RENT_UTIL_SG','RENT_UTIL_DXB','RENT_UTIL_GENEVA','RENT_UTIL_UK','RENT_UTIL_US');

-- §5.4 Capex — 3 bands (0-50K / 50K-200K / 200K+)
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, b.so, b.mn, b.mx
FROM approval_matrices m
JOIN payment_types pt ON pt.id = m.payment_type_id
CROSS JOIN (VALUES
  (1, 0::numeric,           50000::numeric),
  (2, 50000.0001::numeric, 200000::numeric),
  (3, 200000.0001::numeric, NULL::numeric)
) AS b(so, mn, mx)
WHERE pt.code = 'CAPEX';

-- §5.5 Exceptional — single band each (0 to infinity)
INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
SELECT m.id, 1, 0::numeric, NULL::numeric
FROM approval_matrices m
JOIN payment_types pt ON pt.id = m.payment_type_id
WHERE pt.code IN ('EXCEPTIONAL_MA','EXCEPTIONAL_RPT','EXCEPTIONAL_LEGAL','EXCEPTIONAL_WRITEOFF','EXCEPTIONAL_CSR');

-- ============================================================
-- 8. Approval matrix steps
-- ============================================================
-- §5.1 Trade — every band: ACCOUNTS_TEAM (chk) → Ganesh → Pinkesh
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

-- §5.2 Travel Desk — every band: Sachin → Sachin → Pinkesh
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

-- Vendor Payments — bands 1-3: VENDOR_PAYMENT_APPROVERS only; band 4: + Pinkesh
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

-- Annual Subscription — every band: ABHISHEK_TEAM (chk) → Tarang; band 4: + Pinkesh
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

-- Consultants — every band: CONSULTANT_APPROVERS only
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 1, 'ROLE', NULL, (SELECT id FROM roles WHERE code = 'CONSULTANT_APPROVERS')
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code = 'CONSULTANTS_CORPSEC';

-- §5.3 SALARIES — TREASURY_TEAM (chk) → Ganesh
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

-- §5.3 STATUTORY_DUES — ACCOUNTS_TEAM (chk) → AUDIT_TEAM_HEAD
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

-- §5.3 RENT SG — Magaeshwari (chk) → Ganesh
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

-- §5.3 RENT DXB — Shivam (chk) → Ali
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

-- §5.3 RENT Geneva/UK/US — ABHISHEK_TEAM (chk) → Tarang
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

-- §5.4 Capex — every band: Pinkesh only
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 1, 'USER', (SELECT id FROM users WHERE email = 'pinkesh@radiant.com'), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code = 'CAPEX';

-- §5.5 Exceptional — every band: Pinkesh only
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 1, 'USER', (SELECT id FROM users WHERE email = 'pinkesh@radiant.com'), NULL
FROM approval_matrix_bands b
JOIN approval_matrices m ON m.id = b.matrix_id
JOIN payment_types pt    ON pt.id = m.payment_type_id
WHERE pt.code IN ('EXCEPTIONAL_MA','EXCEPTIONAL_RPT','EXCEPTIONAL_LEGAL','EXCEPTIONAL_WRITEOFF','EXCEPTIONAL_CSR');

COMMIT;

-- Verification
SELECT 'roles' AS tbl, count(*) FROM roles
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'user_roles', count(*) FROM user_roles
UNION ALL SELECT 'payment_types', count(*) FROM payment_types
UNION ALL SELECT 'approval_matrices', count(*) FROM approval_matrices
UNION ALL SELECT 'approval_matrix_bands', count(*) FROM approval_matrix_bands
UNION ALL SELECT 'approval_matrix_steps', count(*) FROM approval_matrix_steps;
