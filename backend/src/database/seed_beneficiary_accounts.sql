-- =====================================================================
-- Payments Control System — Beneficiary Accounts Seed Data
-- Creates dummy beneficiary accounts using existing DB reference data:
--   2 vendor accounts  (KOSMOS/HDFC-INR, KOSMOS/HDFC-USD)
--   2 employee accounts (EMP-oo1/HDFC-INR, EMP-oo1/HDFC-EUR)
-- Safe to re-run (inserts are skipped if account_number+bank already exists).
-- =====================================================================
DO $$
DECLARE
  v_bank_hdfc    UUID;
  v_cur_inr      UUID;
  v_cur_usd      UUID;
  v_cur_eur      UUID;
  v_country_in   UUID;
  v_usr          UUID;
  v_cp_kosmos    UUID;
  v_emp_001      UUID;
BEGIN
  -- -------------------------------------------------------------------
  -- Resolve master IDs from existing reference data
  -- -------------------------------------------------------------------
  SELECT id INTO v_bank_hdfc   FROM banks        WHERE short_name = 'HDFC'           LIMIT 1;
  SELECT id INTO v_cur_inr     FROM currencies   WHERE code = 'INR'                  LIMIT 1;
  SELECT id INTO v_cur_usd     FROM currencies   WHERE code = 'USD'                  LIMIT 1;
  SELECT id INTO v_cur_eur     FROM currencies   WHERE code = 'EUR'                  LIMIT 1;
  SELECT id INTO v_country_in  FROM countries    WHERE code = 'IN'                   LIMIT 1;
  SELECT id INTO v_usr         FROM users        WHERE email = 'ganesh@radiant.com'  LIMIT 1;
  SELECT id INTO v_cp_kosmos   FROM counterparties WHERE code = 'KOSMOS'             LIMIT 1;
  SELECT id INTO v_emp_001     FROM employees    WHERE employee_code = 'EMP-oo1'     LIMIT 1;

  -- Guard: abort if critical references are missing
  IF v_bank_hdfc IS NULL THEN RAISE EXCEPTION 'Bank HDFC not found'; END IF;
  IF v_country_in IS NULL THEN RAISE EXCEPTION 'Country IN not found'; END IF;
  IF v_cp_kosmos IS NULL THEN RAISE EXCEPTION 'Counterparty KOSMOS not found'; END IF;
  IF v_emp_001 IS NULL THEN RAISE EXCEPTION 'Employee EMP-oo1 not found'; END IF;

  -- -------------------------------------------------------------------
  -- 1. KOSMOS Resources — HDFC Bank, INR current account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    counterparty_id, account_holder_name,
    account_number, bank_id, branch_name, swift_bic,
    currency_id, country_id, account_direction, status,
    created_by, updated_by
  )
  SELECT
    v_cp_kosmos,
    'Kosmos Resources Ltd',
    '50200012345678', v_bank_hdfc, 'Nariman Point Branch, Mumbai', 'HDFC0002805',
    v_cur_inr, v_country_in, 'PAY_TO', 'ACTIVE',
    v_usr, v_usr
  WHERE NOT EXISTS (
    SELECT 1 FROM beneficiary_accounts
    WHERE bank_id = v_bank_hdfc AND account_number = '50200012345678' AND deleted_at IS NULL
  );

  -- -------------------------------------------------------------------
  -- 2. KOSMOS Resources — HDFC Bank, USD account (international payments)
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    counterparty_id, account_holder_name,
    account_number, bank_id, branch_name, swift_bic,
    currency_id, country_id, account_direction, status,
    created_by, updated_by
  )
  SELECT
    v_cp_kosmos,
    'Kosmos Resources Ltd',
    '50200087654321', v_bank_hdfc, 'Fort Branch, Mumbai', 'HDFC0002805',
    v_cur_usd, v_country_in, 'PAY_TO', 'ACTIVE',
    v_usr, v_usr
  WHERE NOT EXISTS (
    SELECT 1 FROM beneficiary_accounts
    WHERE bank_id = v_bank_hdfc AND account_number = '50200087654321' AND deleted_at IS NULL
  );

  -- -------------------------------------------------------------------
  -- 3. Employee EMP-oo1 — HDFC Bank, INR payroll account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    employee_id, account_holder_name,
    account_number, bank_id, branch_name, swift_bic,
    currency_id, country_id, account_direction, status,
    created_by, updated_by
  )
  SELECT
    v_emp_001,
    'Employee 001',
    '50200011111111', v_bank_hdfc, 'Koramangala Branch, Bengaluru', 'HDFC0002805',
    v_cur_inr, v_country_in, 'PAY_TO', 'ACTIVE',
    v_usr, v_usr
  WHERE NOT EXISTS (
    SELECT 1 FROM beneficiary_accounts
    WHERE bank_id = v_bank_hdfc AND account_number = '50200011111111' AND deleted_at IS NULL
  );

  -- -------------------------------------------------------------------
  -- 4. Employee EMP-oo1 — HDFC Bank, EUR expense reimbursement account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    employee_id, account_holder_name,
    account_number, bank_id, branch_name, swift_bic,
    currency_id, country_id, account_direction, status,
    created_by, updated_by
  )
  SELECT
    v_emp_001,
    'Employee 001',
    '50200022222222', v_bank_hdfc, 'BKC Branch, Mumbai', 'HDFC0002805',
    v_cur_eur, v_country_in, 'PAY_TO', 'ACTIVE',
    v_usr, v_usr
  WHERE NOT EXISTS (
    SELECT 1 FROM beneficiary_accounts
    WHERE bank_id = v_bank_hdfc AND account_number = '50200022222222' AND deleted_at IS NULL
  );

  RAISE NOTICE 'Beneficiary accounts seed complete.';
  RAISE NOTICE '  Bank HDFC: %, Country IN: %', v_bank_hdfc, v_country_in;
  RAISE NOTICE '  Counterparty KOSMOS: %, Employee EMP-oo1: %', v_cp_kosmos, v_emp_001;
END $$;
