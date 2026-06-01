SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================
-- Account types (4)
-- ============================================================
INSERT INTO account_types (name) VALUES
  ('Current'), ('Savings'), ('Deposit'), ('Collateral');

-- ============================================================
-- Countries (5)
-- ============================================================
INSERT INTO countries (country_name, country_short_name, code, currency_id)
SELECT v.country_name, v.country_short_name, v.code, c.id
FROM (VALUES
  ('India',          'IND', 'IN', 'INR'),
  ('United States',  'USA', 'US', 'USD'),
  ('United Arab Emirates','UAE','AE','AED'),
  ('Singapore',      'SGP', 'SG', 'SGD'),
  ('United Kingdom', 'GBR', 'GB', 'GBP')
) AS v(country_name, country_short_name, code, ccy_code)
JOIN currencies c ON c.code = v.ccy_code;

-- ============================================================
-- Banks (3) — group's own (is_counterparty=false)
-- ============================================================
INSERT INTO banks (name, short_name, country_id, swift_bic, is_counterparty)
SELECT v.name, v.short_name, co.id, v.swift_bic, false
FROM (VALUES
  ('HDFC Bank',          'HDFC',     'IN', 'HDFCINBB'),
  ('ICICI Bank',         'ICICI',    'IN', 'ICICINBB'),
  ('Standard Chartered', 'StanChart','GB', 'SCBLGB2L')
) AS v(name, short_name, ccode, swift_bic)
JOIN countries co ON co.code = v.ccode;

-- ============================================================
-- Bank accounts (3) — Radiant's own accounts (is_counterparty=false)
-- ============================================================
INSERT INTO bank_accounts
  (bank_id, bank_nickname, currency_id, account_type_id, account_number,
   branch_name, branch_code, opening_balance, minimum_balance, remaining_balance,
   is_counterparty)
SELECT b.id, v.nickname, c.id, at.id, v.account_number,
       v.branch_name, v.branch_code, v.opening, v.minimum, v.remaining,
       false
FROM (VALUES
  ('HDFC Bank',          'HDFC INR Operating',   'INR', 'Current',  '50100000000001', 'Mumbai BKC',  'HDFC0001234', 5000000.0000::numeric, 100000.0000::numeric, 5000000.0000::numeric),
  ('HDFC Bank',          'HDFC USD Trade',       'USD', 'Current',  '50100000000002', 'Mumbai BKC',  'HDFC0001234', 1000000.0000::numeric, 50000.0000::numeric,  1000000.0000::numeric),
  ('Standard Chartered', 'StanChart GBP London', 'GBP', 'Current',  '01234567',       'London EC2',  'SCBL0001',     500000.0000::numeric, 25000.0000::numeric,   500000.0000::numeric)
) AS v(bank_name, nickname, ccy, acctype, account_number, branch_name, branch_code, opening, minimum, remaining)
JOIN banks b   ON b.name = v.bank_name AND b.is_counterparty = false
JOIN currencies c   ON c.code = v.ccy
JOIN account_types at ON at.name = v.acctype;

-- ============================================================
-- Counterparties (3)
-- ============================================================
INSERT INTO counterparties (code, name, legal_name, role, country_id, primary_contact_name, primary_contact_email, kyc_done)
SELECT v.code, v.name, v.legal_name, v.role, co.id, v.contact_name, v.contact_email, true
FROM (VALUES
  ('KOSMOS',    'Kosmos Resources',    'Kosmos Resources Pvt Ltd', 'VENDOR', 'IN', 'Ramesh Kumar', 'ramesh@kosmos.example'),
  ('GLENCORE',  'Glencore Singapore',  'Glencore Pte Ltd',         'VENDOR', 'SG', 'Lim Wei',      'lim.wei@glencore.example'),
  ('TRAFIGURA', 'Trafigura USA',       'Trafigura Trading LLC',    'VENDOR', 'US', 'John Davis',   'john.davis@trafigura.example')
) AS v(code, name, legal_name, role, ccode, contact_name, contact_email)
JOIN countries co ON co.code = v.ccode;

-- ============================================================
-- Employees (3)
-- ============================================================
INSERT INTO employees (employee_code, full_name, work_email, country_of_employment_id, start_date, mobile_number, compensation_band)
SELECT v.code, v.full_name, v.email, co.id, v.start_date::date, v.mobile, v.band
FROM (VALUES
  ('EMP-001', 'Jane Doe',    'jane.doe@radiant.example',    'IN', '2024-01-15', '+91-9876543210', 'B2'),
  ('EMP-002', 'John Smith',  'john.smith@radiant.example',  'US', '2024-03-01', '+1-2025550100',   'B3'),
  ('EMP-003', 'Ahmed Khan',  'ahmed.khan@radiant.example',  'AE', '2025-06-10', '+971-501234567',  'B2')
) AS v(code, full_name, email, ccode, start_date, mobile, band)
JOIN countries co ON co.code = v.ccode;

-- ============================================================
-- Beneficiary accounts (5) — all ACTIVE (immediately payable)
-- ============================================================
-- Counterparty beneficiaries (3)
INSERT INTO beneficiary_accounts
  (counterparty_id, account_holder_name, account_number, bank_id, branch_name, swift_bic, iban,
   currency_id, country_id, account_direction, status)
SELECT cp.id, v.holder, v.acct_no, b.id, v.branch, v.swift, v.iban,
       c.id, co.id, 'PAY_TO', 'ACTIVE'
FROM (VALUES
  ('KOSMOS',    'Kosmos Resources Pvt Ltd', '50100412345678', 'HDFC Bank',          'Mumbai Fort',   'HDFCINBB',  NULL,                          'INR', 'IN'),
  ('GLENCORE',  'Glencore Pte Ltd',         '01234500',       'Standard Chartered', 'Singapore CBD', 'SCBLSGSG',  NULL,                          'SGD', 'SG'),
  ('TRAFIGURA', 'Trafigura Trading LLC',    '987654321',      'Standard Chartered', 'New York',      'SCBLUS33',  NULL,                          'USD', 'US')
) AS v(cp_code, holder, acct_no, bank_name, branch, swift, iban, ccy, ccode)
JOIN counterparties cp ON cp.code = v.cp_code
JOIN banks b ON b.name = v.bank_name
JOIN currencies c ON c.code = v.ccy
JOIN countries co ON co.code = v.ccode;

-- Employee beneficiaries (2)
INSERT INTO beneficiary_accounts
  (employee_id, account_holder_name, account_number, bank_id, branch_name, swift_bic,
   currency_id, country_id, account_direction, status)
SELECT e.id, v.holder, v.acct_no, b.id, v.branch, v.swift,
       c.id, co.id, 'PAY_TO', 'ACTIVE'
FROM (VALUES
  ('EMP-001', 'Jane Doe',   '50100455544332', 'HDFC Bank',          'Mumbai BKC',  'HDFCINBB', 'INR', 'IN'),
  ('EMP-002', 'John Smith', '11122233344455', 'Standard Chartered', 'New York',    'SCBLUS33', 'USD', 'US')
) AS v(emp_code, holder, acct_no, bank_name, branch, swift, ccy, ccode)
JOIN employees e ON e.employee_code = v.emp_code
JOIN banks b ON b.name = v.bank_name
JOIN currencies c ON c.code = v.ccy
JOIN countries co ON co.code = v.ccode;

COMMIT;

-- Final counts
SELECT 'countries', count(*) FROM countries
UNION ALL SELECT 'account_types', count(*) FROM account_types
UNION ALL SELECT 'banks', count(*) FROM banks
UNION ALL SELECT 'bank_accounts', count(*) FROM bank_accounts
UNION ALL SELECT 'counterparties', count(*) FROM counterparties
UNION ALL SELECT 'employees', count(*) FROM employees
UNION ALL SELECT 'beneficiary_accounts', count(*) FROM beneficiary_accounts;
