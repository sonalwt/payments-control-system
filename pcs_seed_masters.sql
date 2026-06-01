SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================
-- 1. Currencies (7)
-- ============================================================
INSERT INTO currencies (code, name) VALUES
  ('USD', 'US Dollar'),
  ('EUR', 'Euro'),
  ('GBP', 'Pound Sterling'),
  ('INR', 'Indian Rupee'),
  ('AED', 'UAE Dirham'),
  ('SGD', 'Singapore Dollar'),
  ('JPY', 'Japanese Yen');

-- ============================================================
-- 2. Countries (5)
-- ============================================================
INSERT INTO countries (country_name, country_short_name, code, currency_id)
SELECT v.country_name, v.country_short_name, v.code, c.id
FROM (VALUES
  ('India',                'IND', 'IN', 'INR'),
  ('United States',        'USA', 'US', 'USD'),
  ('United Arab Emirates', 'UAE', 'AE', 'AED'),
  ('Singapore',            'SGP', 'SG', 'SGD'),
  ('United Kingdom',       'GBR', 'GB', 'GBP')
) AS v(country_name, country_short_name, code, ccy_code)
JOIN currencies c ON c.code = v.ccy_code;

-- ============================================================
-- 3. Account types (4)
-- ============================================================
INSERT INTO account_types (name) VALUES
  ('Current'), ('Savings'), ('Deposit'), ('Collateral');

-- ============================================================
-- 4. Banks (3) - group own (is_counterparty = false)
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
-- 5. Bank accounts (3) - Radiant's own (is_counterparty = false)
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
  ('HDFC Bank',          'HDFC USD Trade',       'USD', 'Current',  '50100000000002', 'Mumbai BKC',  'HDFC0001234', 1000000.0000::numeric,  50000.0000::numeric, 1000000.0000::numeric),
  ('Standard Chartered', 'StanChart GBP London', 'GBP', 'Current',  '01234567',       'London EC2',  'SCBL0001',     500000.0000::numeric,  25000.0000::numeric,  500000.0000::numeric)
) AS v(bank_name, nickname, ccy, acctype, account_number, branch_name, branch_code, opening, minimum, remaining)
JOIN banks         b   ON b.name = v.bank_name AND b.is_counterparty = false
JOIN currencies    c   ON c.code = v.ccy
JOIN account_types at  ON at.name = v.acctype;

COMMIT;

SELECT 'currencies', count(*) FROM currencies
UNION ALL SELECT 'countries', count(*) FROM countries
UNION ALL SELECT 'account_types', count(*) FROM account_types
UNION ALL SELECT 'banks', count(*) FROM banks
UNION ALL SELECT 'bank_accounts', count(*) FROM bank_accounts;
