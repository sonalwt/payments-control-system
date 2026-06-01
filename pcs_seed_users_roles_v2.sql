SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================
-- 1. Roles
--    Generic: SUPER_ADMIN, COUNTERPARTY, EMPLOYEE, APPROVER
--    Maker teams (PDF §5): OPS_TEAM, TRADING_TEAM, HR, ROHIT_TEAM
--    Checker teams (PDF §5): ACCOUNTS_TEAM, ABHISHEK_TEAM, TREASURY_TEAM
-- ============================================================
INSERT INTO roles (code, name, description, is_system) VALUES
  ('SUPER_ADMIN',     'Super Admin',     'Platform administrator',                                TRUE),
  ('COUNTERPARTY',    'Counterparty',    'External counterparty-portal user',                     TRUE),
  ('EMPLOYEE',        'Employee',        'Internal employee (default for all staff)',             FALSE),
  ('APPROVER',        'Approver',        'Financial authorisation per the authority matrix',      FALSE),
  ('OPS_TEAM',        'Ops Team',        'Maker - Trade Payments (PDF §5.1)',                     FALSE),
  ('TRADING_TEAM',    'Trading Team',    'Maker - Annual Subscription trading platforms',         FALSE),
  ('HR',              'HR',              'Maker - Salaries (PDF §5.3)',                           FALSE),
  ('ROHIT_TEAM',      'Rohit Team',      'Maker - Statutory Dues (PDF §5.3)',                     FALSE),
  ('ACCOUNTS_TEAM',   'Accounts Team',   'Checker - Trade Payments, Statutory Dues',              FALSE),
  ('ABHISHEK_TEAM',   'Abhishek Team',   'Checker - Annual Subscription, Rent Geneva/UK/US',      FALSE),
  ('TREASURY_TEAM',   'Treasury Team',   'Checker - Salaries (PDF §5.3); bank execution',         FALSE);

-- ============================================================
-- 2. Users (25)
--    admin + 24 named individuals from PDF §5
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
-- 3. Baseline user_role assignments
--    - admin gets SUPER_ADMIN
--    - PDF §5 named approvers (Ganesh, Pinkesh, Sachin, Tarang, Ali, Lalit, Harit) get APPROVER
--    - Everyone except admin gets EMPLOYEE
--    Team memberships (OPS_TEAM, ACCOUNTS_TEAM, etc) intentionally left
--    empty; assign via UI once you know who is in each team.
-- ============================================================
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN (VALUES
  ('admin@radiant.com',       'SUPER_ADMIN'),
  -- approvers
  ('ganesh@radiant.com',      'APPROVER'),
  ('pinkesh@radiant.com',     'APPROVER'),
  ('sachin@radiant.com',      'APPROVER'),
  ('tarang@radiant.com',      'APPROVER'),
  ('ali@radiant.com',         'APPROVER'),
  ('lalit@radiant.com',       'APPROVER'),
  ('harit@radiant.com',       'APPROVER'),
  -- employee role for all 24 named staff
  ('ganesh@radiant.com',      'EMPLOYEE'),
  ('pinkesh@radiant.com',     'EMPLOYEE'),
  ('venessa@radiant.com',     'EMPLOYEE'),
  ('sachin@radiant.com',      'EMPLOYEE'),
  ('tarang@radiant.com',      'EMPLOYEE'),
  ('ali@radiant.com',         'EMPLOYEE'),
  ('lalit@radiant.com',       'EMPLOYEE'),
  ('harit@radiant.com',       'EMPLOYEE'),
  ('shivam@radiant.com',      'EMPLOYEE'),
  ('magaeshwari@radiant.com', 'EMPLOYEE'),
  ('saritha@radiant.com',     'EMPLOYEE'),
  ('ghizlane@radiant.com',    'EMPLOYEE'),
  ('mark@radiant.com',        'EMPLOYEE'),
  ('shoaib@radiant.com',      'EMPLOYEE'),
  ('richard@radiant.com',     'EMPLOYEE'),
  ('pritesh@radiant.com',     'EMPLOYEE'),
  ('shivshakthi@radiant.com', 'EMPLOYEE'),
  ('nilesh@radiant.com',      'EMPLOYEE'),
  ('vinayak@radiant.com',     'EMPLOYEE'),
  ('ahmad@radiant.com',       'EMPLOYEE'),
  ('asmita@radiant.com',      'EMPLOYEE'),
  ('sandip@radiant.com',      'EMPLOYEE'),
  ('priyanka@radiant.com',    'EMPLOYEE'),
  ('rohit@radiant.com',       'EMPLOYEE')
) AS x(email, role_code)        ON u.email = x.email
JOIN roles r                    ON r.code  = x.role_code;

COMMIT;

SELECT 'roles' AS tbl, count(*) FROM roles
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'user_roles', count(*) FROM user_roles;
