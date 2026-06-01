SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================
-- 1) Missing users (PDF §5 references these by name)
--    Bcrypt hash is the standard "Radiant@1234"
-- ============================================================
INSERT INTO users (email, password_hash, full_name, is_active, is_platform_admin) VALUES
  ('mark@radiant.com',         '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Mark',         TRUE, FALSE),
  ('shoaib@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Shoaib',       TRUE, FALSE),
  ('richard@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Richard',      TRUE, FALSE),
  ('pritesh@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Pritesh',      TRUE, FALSE),
  ('shivshakthi@radiant.com',  '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Shiv Shakthi', TRUE, FALSE),
  ('nilesh@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Nilesh',       TRUE, FALSE),
  ('vinayak@radiant.com',      '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Vinayak',      TRUE, FALSE),
  ('ahmad@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Ahmad',        TRUE, FALSE),
  ('asmita@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Asmita',       TRUE, FALSE),
  ('sandip@radiant.com',       '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Sandip',       TRUE, FALSE),
  ('priyanka@radiant.com',     '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Priyanka',     TRUE, FALSE),
  ('lalit@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Lalit',        TRUE, FALSE),
  ('harit@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Harit',        TRUE, FALSE),
  ('rohit@radiant.com',        '$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.', 'Rohit',        TRUE, FALSE);

-- ============================================================
-- 2) New roles for the maker pools and OR-approver groups
-- ============================================================
INSERT INTO roles (code, name, description, is_system) VALUES
  ('VENDOR_PAYMENT_MAKERS',     'Vendor Payment Makers',     'Maker pool for §5 Vendor Payments',                FALSE),
  ('VENDOR_PAYMENT_APPROVERS',  'Vendor Payment Approvers',  'Approver 1 pool: Ganesh / Mr Ali',                  FALSE),
  ('CONSULTANTS_MAKERS',        'Consultants Makers',        'Maker pool for §5 Consultants / Corp Sec / Renewals', FALSE),
  ('CONSULTANT_APPROVERS',      'Consultant Approvers',      'Approver pool: Lalit / Harit / Mr Ali',             FALSE);

-- ============================================================
-- 3) Assign users to the new roles
-- ============================================================
-- Vendor Payment Makers (14 users)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.code = 'VENDOR_PAYMENT_MAKERS'
  AND u.email IN (
    'shivam@radiant.com','magaeshwari@radiant.com','saritha@radiant.com','ghizlane@radiant.com',
    'venessa@radiant.com',
    'mark@radiant.com','shoaib@radiant.com','richard@radiant.com','pritesh@radiant.com',
    'shivshakthi@radiant.com','nilesh@radiant.com','vinayak@radiant.com','ahmad@radiant.com','asmita@radiant.com'
  );

-- Vendor Payment Approvers (Ganesh + Mr Ali)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.code = 'VENDOR_PAYMENT_APPROVERS'
  AND u.email IN ('ganesh@radiant.com','ali@radiant.com');

-- Consultants Makers (6 users)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.code = 'CONSULTANTS_MAKERS'
  AND u.email IN (
    'saritha@radiant.com','pritesh@radiant.com','sandip@radiant.com',
    'rohit@radiant.com','vinayak@radiant.com','priyanka@radiant.com'
  );

-- Consultant Approvers (Lalit, Harit, Mr Ali)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.code = 'CONSULTANT_APPROVERS'
  AND u.email IN ('lalit@radiant.com','harit@radiant.com','ali@radiant.com');

-- ============================================================
-- 4) Delete rogue EUR 'test' matrix on TRADE_FINANCE_PAYMENT
-- ============================================================
DELETE FROM approval_matrices
WHERE name = 'test'
  AND payment_type_id = (SELECT id FROM payment_types WHERE code = 'TRADE_FINANCE_PAYMENT')
  AND currency_id = (SELECT id FROM currencies WHERE code = 'EUR');

-- ============================================================
-- 5) Rebuild ANNUAL_SUBSCRIPTION matrix with all 4 bands
--    PDF: Up to 1K / 1K-10K / 10K-50K / Above 50K
--    Chain: Abhishek Team (checker) → Tarang (approver 1)
--    Top band additionally: Pinkesh (approver 2)
-- ============================================================
DELETE FROM approval_matrices
WHERE payment_type_id = (SELECT id FROM payment_types WHERE code = 'ANNUAL_SUBSCRIPTION');

WITH m AS (
  INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, version, status, effective_from, published_at)
  SELECT 'Annual Subscription - Authority Matrix',
         'Per PDF §5 Annual Subscriptions Trading platforms (Iron ore, Basemetals). 4 bands.',
         pt.id, c.id, 1, 'PUBLISHED', CURRENT_DATE, now()
  FROM payment_types pt, currencies c
  WHERE pt.code = 'ANNUAL_SUBSCRIPTION' AND c.code = 'USD'
  RETURNING id
),
b AS (
  INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
  SELECT m.id, v.sort_order, v.mn, v.mx FROM m, (VALUES
    (1, 0.0000::numeric,        1000.0000::numeric),
    (2, 1000.0001::numeric,    10000.0000::numeric),
    (3, 10000.0001::numeric,   50000.0000::numeric),
    (4, 50000.0001::numeric,   NULL::numeric)
  ) AS v(sort_order, mn, mx)
  RETURNING id, sort_order
)
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, s.atype,
       (SELECT id FROM users WHERE email = s.user_email),
       (SELECT id FROM roles WHERE code = s.role_code)
FROM b
JOIN (VALUES
  (1, 1, 'ROLE'::text, NULL::text,            'ABHISHEK_TEAM'),
  (1, 2, 'USER'::text, 'tarang@radiant.com',  NULL::text),
  (2, 1, 'ROLE'::text, NULL::text,            'ABHISHEK_TEAM'),
  (2, 2, 'USER'::text, 'tarang@radiant.com',  NULL::text),
  (3, 1, 'ROLE'::text, NULL::text,            'ABHISHEK_TEAM'),
  (3, 2, 'USER'::text, 'tarang@radiant.com',  NULL::text),
  (4, 1, 'ROLE'::text, NULL::text,            'ABHISHEK_TEAM'),
  (4, 2, 'USER'::text, 'tarang@radiant.com',  NULL::text),
  (4, 3, 'USER'::text, 'pinkesh@radiant.com', NULL::text)
) AS s(band_sort, step_order, atype, user_email, role_code)
  ON b.sort_order = s.band_sort;

-- ============================================================
-- 6) New payment type: VENDOR_PAYMENT + matrix + 4 bands + steps
--    PDF: no checker. Approver 1 = Ganesh/Mr Ali (role).
--    Top band (>25K) adds Pinkesh.
-- ============================================================
INSERT INTO payment_types
  (code, name, description, direction, requires_approval_chain,
   payment_category_id, maker_role_id, checker_role_id, is_system, is_active)
SELECT 'VENDOR_PAYMENT', 'Vendor Payments',
       'Non-trade vendor payments (admin/operational vendors). PDF §5 Non-Trade Vendor Payments.',
       'OUTGOING', TRUE,
       (SELECT id FROM payment_categories WHERE name = 'Non-Trade Payments'),
       (SELECT id FROM roles WHERE code = 'VENDOR_PAYMENT_MAKERS'),
       NULL, TRUE, TRUE;

WITH m AS (
  INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, version, status, effective_from, published_at)
  SELECT 'Vendor Payments - Authority Matrix',
         'Per PDF §5 Non-Trade Vendor Payments. 4 bands.',
         pt.id, c.id, 1, 'PUBLISHED', CURRENT_DATE, now()
  FROM payment_types pt, currencies c
  WHERE pt.code = 'VENDOR_PAYMENT' AND c.code = 'USD'
  RETURNING id
),
b AS (
  INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
  SELECT m.id, v.sort_order, v.mn, v.mx FROM m, (VALUES
    (1, 0.0000::numeric,        1000.0000::numeric),
    (2, 1000.0001::numeric,    10000.0000::numeric),
    (3, 10000.0001::numeric,   25000.0000::numeric),
    (4, 25000.0001::numeric,   NULL::numeric)
  ) AS v(sort_order, mn, mx)
  RETURNING id, sort_order
)
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, s.step_order, s.atype,
       (SELECT id FROM users WHERE email = s.user_email),
       (SELECT id FROM roles WHERE code = s.role_code)
FROM b
JOIN (VALUES
  (1, 1, 'ROLE'::text, NULL::text,            'VENDOR_PAYMENT_APPROVERS'),
  (2, 1, 'ROLE'::text, NULL::text,            'VENDOR_PAYMENT_APPROVERS'),
  (3, 1, 'ROLE'::text, NULL::text,            'VENDOR_PAYMENT_APPROVERS'),
  (4, 1, 'ROLE'::text, NULL::text,            'VENDOR_PAYMENT_APPROVERS'),
  (4, 2, 'USER'::text, 'pinkesh@radiant.com', NULL::text)
) AS s(band_sort, step_order, atype, user_email, role_code)
  ON b.sort_order = s.band_sort;

-- ============================================================
-- 7) New payment type: CONSULTANTS_CORPSEC + matrix + 4 bands + steps
--    PDF: no checker. Approver = Lalit/Harit/Mr Ali (role) for all 4 bands.
-- ============================================================
INSERT INTO payment_types
  (code, name, description, direction, requires_approval_chain,
   payment_category_id, maker_role_id, checker_role_id, is_system, is_active)
SELECT 'CONSULTANTS_CORPSEC', 'Consultants, Corp Sec, Renewals',
       'Non-trade consultants / corp-sec / renewal payments. PDF §5 Non-Trade Consultants.',
       'OUTGOING', TRUE,
       (SELECT id FROM payment_categories WHERE name = 'Non-Trade Payments'),
       (SELECT id FROM roles WHERE code = 'CONSULTANTS_MAKERS'),
       NULL, TRUE, TRUE;

WITH m AS (
  INSERT INTO approval_matrices (name, description, payment_type_id, currency_id, version, status, effective_from, published_at)
  SELECT 'Consultants / Corp Sec / Renewals - Authority Matrix',
         'Per PDF §5 Non-Trade Consultants, Corp Sec, Renewals. 4 bands.',
         pt.id, c.id, 1, 'PUBLISHED', CURRENT_DATE, now()
  FROM payment_types pt, currencies c
  WHERE pt.code = 'CONSULTANTS_CORPSEC' AND c.code = 'USD'
  RETURNING id
),
b AS (
  INSERT INTO approval_matrix_bands (matrix_id, sort_order, min_amount, max_amount)
  SELECT m.id, v.sort_order, v.mn, v.mx FROM m, (VALUES
    (1, 0.0000::numeric,        1000.0000::numeric),
    (2, 1000.0001::numeric,    10000.0000::numeric),
    (3, 10000.0001::numeric,   50000.0000::numeric),
    (4, 50000.0001::numeric,   NULL::numeric)
  ) AS v(sort_order, mn, mx)
  RETURNING id, sort_order
)
INSERT INTO approval_matrix_steps (band_id, step_order, approver_type, approver_user_id, approver_role_id)
SELECT b.id, 1, 'ROLE',
       NULL,
       (SELECT id FROM roles WHERE code = 'CONSULTANT_APPROVERS')
FROM b;

COMMIT;

-- ============================================================
-- Final verification
-- ============================================================
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'roles', count(*) FROM roles
UNION ALL SELECT 'user_roles', count(*) FROM user_roles
UNION ALL SELECT 'payment_types', count(*) FROM payment_types
UNION ALL SELECT 'approval_matrices', count(*) FROM approval_matrices
UNION ALL SELECT 'approval_matrix_bands', count(*) FROM approval_matrix_bands
UNION ALL SELECT 'approval_matrix_steps', count(*) FROM approval_matrix_steps;
