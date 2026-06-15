-- =====================================================================
-- Payments Control System — Beneficiary Accounts Seed Data
-- Creates 7 ACTIVE beneficiary accounts:
--   3 vendor accounts  (Infosys/HDFC-INR, TCS/HDFC-INR, AWS/ENBD-AED)
--   4 employee accounts (Alice/HDFC-INR, Bob/HDFC-INR, Carol/ENBD-AED,
--                        Dave/DBS-SGD)
-- Also links employee_bank_account_id for all 4 employees.
-- Safe to re-run (ON CONFLICT DO NOTHING).
-- =====================================================================
DO $$
DECLARE
  v_bank_hdfc  UUID;
  v_bank_enbd  UUID;
  v_bank_dbs   UUID;
  v_cur_inr    UUID;
  v_cur_aed    UUID;
  v_cur_sgd    UUID;
  v_usr_admin  UUID;
  v_cp_infosys UUID;
  v_cp_tcs     UUID;
  v_cp_aws     UUID;
  v_emp_alice  UUID;
  v_emp_bob    UUID;
  v_emp_carol  UUID;
  v_emp_dave   UUID;

  v_bene_infosys UUID;
  v_bene_tcs     UUID;
  v_bene_aws     UUID;
  v_bene_alice   UUID;
  v_bene_bob     UUID;
  v_bene_carol   UUID;
  v_bene_dave    UUID;
BEGIN
  -- -------------------------------------------------------------------
  -- Resolve master IDs
  -- -------------------------------------------------------------------
  SELECT id INTO v_bank_hdfc  FROM banks       WHERE short_name = 'HDFC' LIMIT 1;
  SELECT id INTO v_bank_enbd  FROM banks       WHERE short_name = 'ENBD' LIMIT 1;
  SELECT id INTO v_bank_dbs   FROM banks       WHERE short_name = 'DBS'  LIMIT 1;
  SELECT id INTO v_cur_inr    FROM currencies  WHERE code = 'INR'        LIMIT 1;
  SELECT id INTO v_cur_aed    FROM currencies  WHERE code = 'AED'        LIMIT 1;
  SELECT id INTO v_cur_sgd    FROM currencies  WHERE code = 'SGD'        LIMIT 1;
  SELECT id INTO v_usr_admin  FROM users       WHERE email = 'admin@acme.com' LIMIT 1;
  SELECT id INTO v_cp_infosys FROM counterparties WHERE code = 'INFOSYS' LIMIT 1;
  SELECT id INTO v_cp_tcs     FROM counterparties WHERE code = 'TCS'     LIMIT 1;
  SELECT id INTO v_cp_aws     FROM counterparties WHERE code = 'AWS'     LIMIT 1;
  SELECT id INTO v_emp_alice  FROM employees   WHERE employee_code = 'EMP001' LIMIT 1;
  SELECT id INTO v_emp_bob    FROM employees   WHERE employee_code = 'EMP002' LIMIT 1;
  SELECT id INTO v_emp_carol  FROM employees   WHERE employee_code = 'EMP003' LIMIT 1;
  SELECT id INTO v_emp_dave   FROM employees   WHERE employee_code = 'EMP004' LIMIT 1;

  -- -------------------------------------------------------------------
  -- 1. Infosys Limited — HDFC Bank, INR current account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    counterparty_id, account_holder_name,
    account_number,   bank_id, bank_name, branch_name, swift_bic,
    currency_id, country_code, status,
    created_by, updated_by
  ) VALUES (
    v_cp_infosys,
    'Infosys Limited',
    '50200012345678', v_bank_hdfc, 'HDFC Bank Limited',
    'Electronic City Branch, Bengaluru', 'HDFCINBB',
    v_cur_inr, 'IN', 'ACTIVE',
    v_usr_admin, v_usr_admin
  )
  ON CONFLICT (bank_id, account_number) DO NOTHING
  RETURNING id INTO v_bene_infosys;

  IF v_bene_infosys IS NULL THEN
    SELECT id INTO v_bene_infosys FROM beneficiary_accounts
    WHERE bank_id = v_bank_hdfc AND account_number = '50200012345678' LIMIT 1;
  END IF;

  -- -------------------------------------------------------------------
  -- 2. Tata Consultancy Services — HDFC Bank, INR current account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    counterparty_id, account_holder_name,
    account_number,   bank_id, bank_name, branch_name, swift_bic,
    currency_id, country_code, status,
    created_by, updated_by
  ) VALUES (
    v_cp_tcs,
    'Tata Consultancy Services Limited',
    '50200087654321', v_bank_hdfc, 'HDFC Bank Limited',
    'Nariman Point Branch, Mumbai', 'HDFCINBB',
    v_cur_inr, 'IN', 'ACTIVE',
    v_usr_admin, v_usr_admin
  )
  ON CONFLICT (bank_id, account_number) DO NOTHING
  RETURNING id INTO v_bene_tcs;

  IF v_bene_tcs IS NULL THEN
    SELECT id INTO v_bene_tcs FROM beneficiary_accounts
    WHERE bank_id = v_bank_hdfc AND account_number = '50200087654321' LIMIT 1;
  END IF;

  -- -------------------------------------------------------------------
  -- 3. Amazon Web Services — Emirates NBD, AED account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    counterparty_id, account_holder_name,
    account_number,   bank_id, bank_name, branch_name, swift_bic,
    iban, currency_id, country_code, status,
    created_by, updated_by
  ) VALUES (
    v_cp_aws,
    'Amazon Web Services Inc',
    '1234567890123',  v_bank_enbd, 'Emirates NBD Bank',
    'DIFC Branch, Dubai', 'EBILAEAD',
    'AE070331234567890123456',
    v_cur_aed, 'AE', 'ACTIVE',
    v_usr_admin, v_usr_admin
  )
  ON CONFLICT (bank_id, account_number) DO NOTHING
  RETURNING id INTO v_bene_aws;

  IF v_bene_aws IS NULL THEN
    SELECT id INTO v_bene_aws FROM beneficiary_accounts
    WHERE bank_id = v_bank_enbd AND account_number = '1234567890123' LIMIT 1;
  END IF;

  -- -------------------------------------------------------------------
  -- 4. Alice Johnson (EMP001) — HDFC Bank, INR payroll account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    employee_id, account_holder_name,
    account_number,   bank_id, bank_name, branch_name, swift_bic,
    currency_id, country_code, status,
    created_by, updated_by
  ) VALUES (
    v_emp_alice,
    'Alice Johnson',
    '50200011111111', v_bank_hdfc, 'HDFC Bank Limited',
    'Koramangala Branch, Bengaluru', 'HDFCINBB',
    v_cur_inr, 'IN', 'ACTIVE',
    v_usr_admin, v_usr_admin
  )
  ON CONFLICT (bank_id, account_number) DO NOTHING
  RETURNING id INTO v_bene_alice;

  IF v_bene_alice IS NULL THEN
    SELECT id INTO v_bene_alice FROM beneficiary_accounts
    WHERE bank_id = v_bank_hdfc AND account_number = '50200011111111' LIMIT 1;
  END IF;

  -- -------------------------------------------------------------------
  -- 5. Bob Smith (EMP002) — HDFC Bank, INR payroll account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    employee_id, account_holder_name,
    account_number,   bank_id, bank_name, branch_name, swift_bic,
    currency_id, country_code, status,
    created_by, updated_by
  ) VALUES (
    v_emp_bob,
    'Bob Smith',
    '50200022222222', v_bank_hdfc, 'HDFC Bank Limited',
    'Whitefield Branch, Bengaluru', 'HDFCINBB',
    v_cur_inr, 'IN', 'ACTIVE',
    v_usr_admin, v_usr_admin
  )
  ON CONFLICT (bank_id, account_number) DO NOTHING
  RETURNING id INTO v_bene_bob;

  IF v_bene_bob IS NULL THEN
    SELECT id INTO v_bene_bob FROM beneficiary_accounts
    WHERE bank_id = v_bank_hdfc AND account_number = '50200022222222' LIMIT 1;
  END IF;

  -- -------------------------------------------------------------------
  -- 6. Carol Williams (EMP003) — Emirates NBD, AED exec account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    employee_id, account_holder_name,
    account_number,   bank_id, bank_name, branch_name, swift_bic,
    iban, currency_id, country_code, status,
    created_by, updated_by
  ) VALUES (
    v_emp_carol,
    'Carol Williams',
    '9876543210123',  v_bank_enbd, 'Emirates NBD Bank',
    'Business Bay Branch, Dubai', 'EBILAEAD',
    'AE070330987654321098765',
    v_cur_aed, 'AE', 'ACTIVE',
    v_usr_admin, v_usr_admin
  )
  ON CONFLICT (bank_id, account_number) DO NOTHING
  RETURNING id INTO v_bene_carol;

  IF v_bene_carol IS NULL THEN
    SELECT id INTO v_bene_carol FROM beneficiary_accounts
    WHERE bank_id = v_bank_enbd AND account_number = '9876543210123' LIMIT 1;
  END IF;

  -- -------------------------------------------------------------------
  -- 7. Dave Brown (EMP004) — DBS Bank, SGD contractor account
  -- -------------------------------------------------------------------
  INSERT INTO beneficiary_accounts(
    employee_id, account_holder_name,
    account_number,   bank_id, bank_name, branch_name, swift_bic,
    currency_id, country_code, status,
    created_by, updated_by
  ) VALUES (
    v_emp_dave,
    'Dave Brown',
    '0331234567',     v_bank_dbs, 'DBS Bank Ltd',
    'Raffles Place Branch, Singapore', 'DBSSSGSG',
    v_cur_sgd, 'SG', 'ACTIVE',
    v_usr_admin, v_usr_admin
  )
  ON CONFLICT (bank_id, account_number) DO NOTHING
  RETURNING id INTO v_bene_dave;

  IF v_bene_dave IS NULL THEN
    SELECT id INTO v_bene_dave FROM beneficiary_accounts
    WHERE bank_id = v_bank_dbs AND account_number = '0331234567' LIMIT 1;
  END IF;

  -- -------------------------------------------------------------------
  -- Link employee_bank_account_id for all 4 employees
  -- -------------------------------------------------------------------
  UPDATE employees SET employee_bank_account_id = v_bene_alice
  WHERE id = v_emp_alice AND employee_bank_account_id IS NULL;

  UPDATE employees SET employee_bank_account_id = v_bene_bob
  WHERE id = v_emp_bob AND employee_bank_account_id IS NULL;

  UPDATE employees SET employee_bank_account_id = v_bene_carol
  WHERE id = v_emp_carol AND employee_bank_account_id IS NULL;

  UPDATE employees SET employee_bank_account_id = v_bene_dave
  WHERE id = v_emp_dave AND employee_bank_account_id IS NULL;

  RAISE NOTICE 'Beneficiary accounts seed complete:';
  RAISE NOTICE '  Vendors  — Infosys (%), TCS (%), AWS (%)',
    v_bene_infosys, v_bene_tcs, v_bene_aws;
  RAISE NOTICE '  Employees — Alice (%), Bob (%), Carol (%), Dave (%)',
    v_bene_alice, v_bene_bob, v_bene_carol, v_bene_dave;
END $$;
