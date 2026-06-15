-- =====================================================================
-- Payments Control System — Dummy Seed Data
-- Run: psql -U postgres -d pcs -f backend/src/database/seed_dummy.sql
-- All inserts are idempotent (safe to run more than once).
-- =====================================================================

DO $$
DECLARE
  -- Groups
  v_grp_acme       UUID;
  v_grp_beta       UUID;

  -- Currency IDs (fetched from existing seed)
  v_cur_inr        UUID;
  v_cur_aed        UUID;
  v_cur_sgd        UUID;
  v_cur_usd        UUID;

  -- Legal Entities
  v_le_acme_in     UUID;
  v_le_acme_ae     UUID;
  v_le_beta_sg     UUID;

  -- Countries
  v_cty_in         UUID;
  v_cty_ae         UUID;
  v_cty_sg         UUID;

  -- Business Units
  v_bu_eng         UUID;
  v_bu_fin         UUID;
  v_bu_prd         UUID;

  -- Departments
  v_dept_backend   UUID;
  v_dept_treasury  UUID;
  v_dept_design    UUID;

  -- Users
  v_usr_admin      UUID;
  v_usr_alice      UUID;
  v_usr_bob        UUID;
  v_usr_carol      UUID;
  v_usr_dave       UUID;
  v_usr_eve        UUID;

  -- Roles
  v_role_super     UUID;
  v_role_init      UUID;
  v_role_appr      UUID;
  v_role_maker     UUID;
  v_role_checker   UUID;
  v_role_fhead     UUID;

  -- Banks
  v_bank_hdfc      UUID;
  v_bank_enbd      UUID;
  v_bank_dbs       UUID;

  -- Bank Accounts
  v_acc_acme_ops   UUID;
  v_acc_acme_pr    UUID;
  v_acc_acme_ae    UUID;
  v_acc_beta_dep   UUID;

  -- Approval Matrix
  v_mat_vendor     UUID;
  v_band1          UUID;
  v_band2          UUID;
  v_band3          UUID;

BEGIN

  -- ----------------------------------------------------------------
  -- Resolve existing seed IDs (currencies and roles are already seeded
  -- by the schema migration and should always exist).
  -- ----------------------------------------------------------------
  SELECT id INTO v_cur_inr FROM currencies WHERE code = 'INR';
  SELECT id INTO v_cur_aed FROM currencies WHERE code = 'AED';
  SELECT id INTO v_cur_sgd FROM currencies WHERE code = 'SGD';
  SELECT id INTO v_cur_usd FROM currencies WHERE code = 'USD';

  SELECT id INTO v_role_super   FROM roles WHERE code = 'SUPER_ADMIN';
  SELECT id INTO v_role_init    FROM roles WHERE code = 'INITIATOR';
  SELECT id INTO v_role_appr    FROM roles WHERE code = 'APPROVER';
  SELECT id INTO v_role_maker   FROM roles WHERE code = 'PAYMENTS_MAKER';
  SELECT id INTO v_role_checker FROM roles WHERE code = 'PAYMENTS_CHECKER';
  SELECT id INTO v_role_fhead   FROM roles WHERE code = 'FINANCE_HEAD';

  -- ================================================================
  -- SECTION 1.1  Groups
  -- ================================================================
  INSERT INTO groups(name, code, description)
  VALUES ('ACME Corporation Group', 'ACME', 'Flagship conglomerate — India and UAE operations')
  ON CONFLICT (code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_grp_acme;

  INSERT INTO groups(name, code, description)
  VALUES ('Beta Holdings Group', 'BETA', 'Singapore-based technology holding company')
  ON CONFLICT (code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_grp_beta;

  -- ================================================================
  -- SECTION 1.1  Legal Entities
  -- ================================================================
  INSERT INTO legal_entities(group_id, name, code, registered_country, base_currency_id, tax_identifier)
  VALUES (v_grp_acme, 'ACME Technologies India Pvt Ltd', 'ACME-IN', 'IN', v_cur_inr, 'GSTIN27AABCA1234A1ZX')
  ON CONFLICT (group_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_le_acme_in;

  INSERT INTO legal_entities(group_id, name, code, registered_country, base_currency_id, tax_identifier)
  VALUES (v_grp_acme, 'ACME International FZE', 'ACME-AE', 'AE', v_cur_aed, 'TRN100123456789001')
  ON CONFLICT (group_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_le_acme_ae;

  INSERT INTO legal_entities(group_id, name, code, registered_country, base_currency_id, tax_identifier)
  VALUES (v_grp_beta, 'Beta Software Pte Ltd', 'BETA-SG', 'SG', v_cur_sgd, 'UEN201999999Z')
  ON CONFLICT (group_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_le_beta_sg;

  -- ================================================================
  -- SECTION 1.1  Countries
  -- ================================================================
  INSERT INTO countries(legal_entity_id, name, iso_code)
  VALUES (v_le_acme_in, 'India', 'IN')
  ON CONFLICT (legal_entity_id, iso_code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_cty_in;

  INSERT INTO countries(legal_entity_id, name, iso_code)
  VALUES (v_le_acme_ae, 'United Arab Emirates', 'AE')
  ON CONFLICT (legal_entity_id, iso_code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_cty_ae;

  INSERT INTO countries(legal_entity_id, name, iso_code)
  VALUES (v_le_beta_sg, 'Singapore', 'SG')
  ON CONFLICT (legal_entity_id, iso_code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_cty_sg;

  -- ================================================================
  -- SECTION 1.1  Business Units
  -- ================================================================
  INSERT INTO business_units(country_id, name, code, description)
  VALUES (v_cty_in, 'Engineering', 'ENG', 'Software engineering and R&D')
  ON CONFLICT (country_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_bu_eng;

  INSERT INTO business_units(country_id, name, code, description)
  VALUES (v_cty_ae, 'Finance', 'FIN', 'Group treasury and finance operations')
  ON CONFLICT (country_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_bu_fin;

  INSERT INTO business_units(country_id, name, code, description)
  VALUES (v_cty_sg, 'Product', 'PRD', 'Product design and management')
  ON CONFLICT (country_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_bu_prd;

  -- ================================================================
  -- SECTION 1.1  Departments
  -- ================================================================
  INSERT INTO departments(business_unit_id, name, code, description)
  VALUES (v_bu_eng, 'Backend Development', 'BACKEND', 'Backend APIs and infrastructure')
  ON CONFLICT (business_unit_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_dept_backend;

  INSERT INTO departments(business_unit_id, name, code, description)
  VALUES (v_bu_fin, 'Treasury', 'TREAS', 'Cash management and FX')
  ON CONFLICT (business_unit_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_dept_treasury;

  INSERT INTO departments(business_unit_id, name, code, description)
  VALUES (v_bu_prd, 'Design', 'DESIGN', 'UX and product design')
  ON CONFLICT (business_unit_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_dept_design;

  -- ================================================================
  -- SECTION 1.1  Users  (password: ChangeMe123!)
  -- ================================================================
  INSERT INTO users(email, password_hash, full_name, employee_code, is_active, is_platform_admin)
  VALUES ('admin@acme.com', crypt('ChangeMe123!', gen_salt('bf', 12)),
          'System Administrator', 'SYS001', TRUE, TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_admin;

  INSERT INTO users(email, password_hash, full_name, employee_code, is_active)
  VALUES ('alice@acme.com', crypt('ChangeMe123!', gen_salt('bf', 12)),
          'Alice Johnson', 'USR001', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_alice;

  INSERT INTO users(email, password_hash, full_name, employee_code, is_active)
  VALUES ('bob@acme.com', crypt('ChangeMe123!', gen_salt('bf', 12)),
          'Bob Smith', 'USR002', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_bob;

  INSERT INTO users(email, password_hash, full_name, employee_code, is_active)
  VALUES ('carol@acme.com', crypt('ChangeMe123!', gen_salt('bf', 12)),
          'Carol Williams', 'USR003', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_carol;

  INSERT INTO users(email, password_hash, full_name, employee_code, is_active)
  VALUES ('dave@acme.com', crypt('ChangeMe123!', gen_salt('bf', 12)),
          'Dave Brown', 'USR004', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_dave;

  INSERT INTO users(email, password_hash, full_name, employee_code, is_active)
  VALUES ('eve@beta.com', crypt('ChangeMe123!', gen_salt('bf', 12)),
          'Eve Chen', 'BETA001', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_eve;

  -- ================================================================
  -- SECTION 1.1  User-Entity-Role assignments
  -- ================================================================
  INSERT INTO user_entity_roles(user_id, legal_entity_id, role_id, is_active)
  VALUES
    (v_usr_alice, v_le_acme_in, v_role_init,    TRUE),
    (v_usr_alice, v_le_acme_ae, v_role_init,    TRUE),
    (v_usr_bob,   v_le_acme_in, v_role_appr,    TRUE),
    (v_usr_bob,   v_le_acme_ae, v_role_appr,    TRUE),
    (v_usr_carol, v_le_acme_in, v_role_fhead,   TRUE),
    (v_usr_dave,  v_le_acme_in, v_role_maker,   TRUE),
    (v_usr_dave,  v_le_acme_in, v_role_checker, TRUE),
    (v_usr_eve,   v_le_beta_sg, v_role_super,   TRUE)
  ON CONFLICT (user_id, legal_entity_id, role_id) DO NOTHING;

  RAISE NOTICE 'Section 1.1 — org hierarchy, users, roles: done.';

  -- ================================================================
  -- SECTION 1.3  Counterparties
  -- ================================================================
  INSERT INTO counterparties(code, name, legal_name, role, country_code,
                              primary_contact_name, primary_contact_email)
  VALUES
    ('INFOSYS', 'Infosys Limited',
     'Infosys Limited', 'VENDOR', 'IN',
     'Procurement Team', 'payments@infosys.com'),

    ('TCS', 'Tata Consultancy Services',
     'Tata Consultancy Services Limited', 'VENDOR', 'IN',
     'Accounts Payable', 'ar@tcs.com'),

    ('AWS', 'Amazon Web Services',
     'Amazon Web Services Inc', 'VENDOR', 'US',
     'AWS Billing', 'aws-billing@amazon.com'),

    ('MSFT', 'Microsoft Corporation',
     'Microsoft Corporation', 'CUSTOMER', 'US',
     'Enterprise Contracts', 'enterprise@microsoft.com'),

    ('GOOGLE-IN', 'Google India',
     'Google India Private Limited', 'CUSTOMER', 'IN',
     'Finance Team', 'finops@google.com')
  ON CONFLICT (code) DO NOTHING;

  RAISE NOTICE 'Section 1.3 — counterparties: done.';

  -- ================================================================
  -- SECTION 1.4  Employees
  -- ================================================================
  INSERT INTO employees(employee_code, full_name, preferred_name, work_email,
                         legal_entity_id, country_code, base_currency_id,
                         payroll_category, employment_start_date, is_active)
  VALUES
    ('EMP001', 'Alice Johnson', 'Alice', 'alice@acme.com',
     v_le_acme_in, 'IN', v_cur_inr, 'STAFF', '2022-01-10', TRUE),

    ('EMP002', 'Bob Smith', 'Bob', 'bob@acme.com',
     v_le_acme_in, 'IN', v_cur_inr, 'STAFF', '2021-06-01', TRUE),

    ('EMP003', 'Carol Williams', 'Carol', 'carol@acme.com',
     v_le_acme_in, 'IN', v_cur_inr, 'EXEC', '2019-03-15', TRUE),

    ('EMP004', 'Dave Brown', 'Dave', 'dave@acme.com',
     v_le_acme_in, 'IN', v_cur_inr, 'CONTRACTOR', '2023-09-01', TRUE)
  ON CONFLICT (legal_entity_id, employee_code) DO NOTHING;

  RAISE NOTICE 'Section 1.4 — employees: done.';

  -- ================================================================
  -- SECTION 1.5  Approval Matrix — VENDOR_PAYMENT
  --   3 INR bands × 2 steps each = 6 steps total
  --   Band 1:   INR 0 – 50,000      (0 – 5,000,000 minor units)
  --   Band 2:   INR 50,001 – 500,000 (5,000,001 – 50,000,000 minor)
  --   Band 3:   INR 500,001+         (50,000,001+ minor, open-ended)
  -- ================================================================
  INSERT INTO approval_matrices(name, description, payment_type_code,
                                 effective_from)
  VALUES (
    'Vendor Payment — Standard INR Matrix v1',
    'Three-tier INR approval matrix for vendor payments',
    'VENDOR_PAYMENT',
    CURRENT_DATE
  )
  ON CONFLICT (payment_type_code, version) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_mat_vendor;

  -- Band 1
  INSERT INTO approval_matrix_bands(matrix_id, currency_code, min_amount_minor, max_amount_minor, sort_order)
  VALUES (v_mat_vendor, 'INR', 0, 5000000, 1)
  ON CONFLICT (matrix_id, currency_code, min_amount_minor) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_band1;

  -- Band 2
  INSERT INTO approval_matrix_bands(matrix_id, currency_code, min_amount_minor, max_amount_minor, sort_order)
  VALUES (v_mat_vendor, 'INR', 5000001, 50000000, 2)
  ON CONFLICT (matrix_id, currency_code, min_amount_minor) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_band2;

  -- Band 3 (open-ended)
  INSERT INTO approval_matrix_bands(matrix_id, currency_code, min_amount_minor, max_amount_minor, sort_order)
  VALUES (v_mat_vendor, 'INR', 50000001, NULL, 3)
  ON CONFLICT (matrix_id, currency_code, min_amount_minor) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_band3;

  -- Steps — Band 1
  INSERT INTO approval_matrix_steps(band_id, step_order, approver_type, approver_role_id)
  VALUES (v_band1, 1, 'ROLE', v_role_appr)
  ON CONFLICT (band_id, step_order) DO NOTHING;

  INSERT INTO approval_matrix_steps(band_id, step_order, approver_type, approver_role_id)
  VALUES (v_band1, 2, 'ROLE', v_role_fhead)
  ON CONFLICT (band_id, step_order) DO NOTHING;

  -- Steps — Band 2
  INSERT INTO approval_matrix_steps(band_id, step_order, approver_type, approver_role_id)
  VALUES (v_band2, 1, 'ROLE', v_role_appr)
  ON CONFLICT (band_id, step_order) DO NOTHING;

  INSERT INTO approval_matrix_steps(band_id, step_order, approver_type, approver_role_id)
  VALUES (v_band2, 2, 'ROLE', v_role_fhead)
  ON CONFLICT (band_id, step_order) DO NOTHING;

  -- Steps — Band 3
  INSERT INTO approval_matrix_steps(band_id, step_order, approver_type, approver_role_id)
  VALUES (v_band3, 1, 'ROLE', v_role_appr)
  ON CONFLICT (band_id, step_order) DO NOTHING;

  INSERT INTO approval_matrix_steps(band_id, step_order, approver_type, approver_role_id)
  VALUES (v_band3, 2, 'ROLE', v_role_fhead)
  ON CONFLICT (band_id, step_order) DO NOTHING;

  RAISE NOTICE 'Section 1.5 — approval matrix (3 bands, 6 steps): done.';

  -- ================================================================
  -- SECTION 1.6  Sanctioned Countries
  -- ================================================================
  IF NOT EXISTS (SELECT 1 FROM sanctioned_countries WHERE country_code = 'IR' AND deleted_at IS NULL) THEN
    INSERT INTO sanctioned_countries(country_code, country_name, reason, is_active)
    VALUES ('IR', 'Iran', 'OFAC comprehensive sanctions — SDN list', TRUE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sanctioned_countries WHERE country_code = 'KP' AND deleted_at IS NULL) THEN
    INSERT INTO sanctioned_countries(country_code, country_name, reason, is_active)
    VALUES ('KP', 'North Korea', 'UN Security Council sanctions + OFAC DPRK programme', TRUE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sanctioned_countries WHERE country_code = 'SY' AND deleted_at IS NULL) THEN
    INSERT INTO sanctioned_countries(country_code, country_name, reason, is_active)
    VALUES ('SY', 'Syria', 'OFAC Syria sanctions programme — EO 13894', TRUE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM sanctioned_countries WHERE country_code = 'CU' AND deleted_at IS NULL) THEN
    INSERT INTO sanctioned_countries(country_code, country_name, reason, is_active)
    VALUES ('CU', 'Cuba', 'OFAC Cuban Assets Control Regulations (CACR)', TRUE);
  END IF;

  RAISE NOTICE 'Section 1.6 — sanctioned countries: done.';

  -- ================================================================
  -- SECTION 2.2  FX Rates  (USD base, today)
  -- ================================================================
  INSERT INTO fx_rates(base_currency_code, quote_currency_code, rate,
                        as_of_date, source, provider_name, override_reason)
  VALUES
    ('USD', 'INR', 83.5000000000,  CURRENT_DATE, 'MANUAL_OVERRIDE', 'SEED', 'Dummy seed rate'),
    ('USD', 'AED', 3.6725000000,   CURRENT_DATE, 'MANUAL_OVERRIDE', 'SEED', 'Dummy seed rate'),
    ('USD', 'SGD', 1.3450000000,   CURRENT_DATE, 'MANUAL_OVERRIDE', 'SEED', 'Dummy seed rate'),
    ('USD', 'EUR', 0.9200000000,   CURRENT_DATE, 'MANUAL_OVERRIDE', 'SEED', 'Dummy seed rate'),
    ('USD', 'GBP', 0.7900000000,   CURRENT_DATE, 'MANUAL_OVERRIDE', 'SEED', 'Dummy seed rate'),
    ('USD', 'CNY', 7.2300000000,   CURRENT_DATE, 'MANUAL_OVERRIDE', 'SEED', 'Dummy seed rate'),
    ('INR', 'USD', 0.0119760000,   CURRENT_DATE, 'MANUAL_OVERRIDE', 'SEED', 'Dummy seed rate'),
    ('AED', 'USD', 0.2723000000,   CURRENT_DATE, 'MANUAL_OVERRIDE', 'SEED', 'Dummy seed rate')
  ON CONFLICT (base_currency_code, quote_currency_code, as_of_date) DO NOTHING;

  RAISE NOTICE 'Section 2.2 — FX rates: done.';

  -- ================================================================
  -- SECTION 2.3  Banks
  -- ================================================================
  INSERT INTO banks(name, short_name, country_code, swift_bic, address)
  VALUES ('HDFC Bank Limited', 'HDFC', 'IN', 'HDFCINBB',
          'HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai 400013')
  ON CONFLICT (name, country_code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_bank_hdfc;

  INSERT INTO banks(name, short_name, country_code, swift_bic, address)
  VALUES ('Emirates NBD Bank', 'ENBD', 'AE', 'EBILAEAD',
          'Baniyas Road, Deira, P.O. Box 777, Dubai, UAE')
  ON CONFLICT (name, country_code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_bank_enbd;

  INSERT INTO banks(name, short_name, country_code, swift_bic, address)
  VALUES ('DBS Bank Ltd', 'DBS', 'SG', 'DBSSSGSG',
          '12 Marina Boulevard, DBS Asia Central, Singapore 018982')
  ON CONFLICT (name, country_code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_bank_dbs;

  RAISE NOTICE 'Section 2.3 — banks: done.';

  -- ================================================================
  -- SECTION 2.4  Bank Accounts
  -- ================================================================
  INSERT INTO bank_accounts(nickname, legal_entity_id, bank_id, currency_id,
                             account_number, account_type, branch_name,
                             balance, balance_as_of, balance_source, minimum_balance)
  VALUES (
    'ACME India — Operations Current', v_le_acme_in, v_bank_hdfc, v_cur_inr,
    'HDFC100001000', 'CURRENT', 'Andheri East Branch',
    5000000.00, now(), 'SEEDED', 250000.00
  )
  ON CONFLICT (bank_id, account_number) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_acc_acme_ops;

  INSERT INTO bank_accounts(nickname, legal_entity_id, bank_id, currency_id,
                             account_number, account_type, branch_name,
                             balance, balance_as_of, balance_source, minimum_balance)
  VALUES (
    'ACME India — Payroll Current', v_le_acme_in, v_bank_hdfc, v_cur_inr,
    'HDFC100002000', 'CURRENT', 'Andheri East Branch',
    2500000.00, now(), 'SEEDED', 100000.00
  )
  ON CONFLICT (bank_id, account_number) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_acc_acme_pr;

  INSERT INTO bank_accounts(nickname, legal_entity_id, bank_id, currency_id,
                             account_number, account_type, branch_name,
                             balance, balance_as_of, balance_source, minimum_balance)
  VALUES (
    'ACME FZE — Operations Current', v_le_acme_ae, v_bank_enbd, v_cur_aed,
    'ENBD200001000', 'CURRENT', 'Deira Main Branch',
    1000000.00, now(), 'SEEDED', 50000.00
  )
  ON CONFLICT (bank_id, account_number) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_acc_acme_ae;

  INSERT INTO bank_accounts(nickname, legal_entity_id, bank_id, currency_id,
                             account_number, account_type, branch_name,
                             balance, balance_as_of, balance_source, minimum_balance)
  VALUES (
    'Beta SG — Term Deposit', v_le_beta_sg, v_bank_dbs, v_cur_sgd,
    'DBS300001000', 'DEPOSIT', 'Marina Bay Branch',
    800000.00, now(), 'SEEDED', NULL
  )
  ON CONFLICT (bank_id, account_number) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_acc_beta_dep;

  RAISE NOTICE 'Section 2.4 — bank accounts: done.';

  -- ================================================================
  -- SECTION 2.5  Balance Changes  (opening entries for CURRENT accounts)
  -- ================================================================
  INSERT INTO balance_changes(account_id, kind, previous_balance, new_balance, delta, reason, changed_by)
  VALUES
    (v_acc_acme_ops, 'MANUAL_OVERRIDE', 0, 5000000.00, 5000000.00,
     'Opening balance — seed data', v_usr_admin),
    (v_acc_acme_pr,  'MANUAL_OVERRIDE', 0, 2500000.00, 2500000.00,
     'Opening balance — seed data', v_usr_admin),
    (v_acc_acme_ae,  'MANUAL_OVERRIDE', 0, 1000000.00, 1000000.00,
     'Opening balance — seed data', v_usr_admin);

  RAISE NOTICE 'Section 2.5 — balance change log: done.';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL SEED DATA INSERTED SUCCESSFULLY.';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Login credentials (all users):';
  RAISE NOTICE '  admin@acme.com  / ChangeMe123!  (platform admin)';
  RAISE NOTICE '  alice@acme.com  / ChangeMe123!  (initiator)';
  RAISE NOTICE '  bob@acme.com    / ChangeMe123!  (approver)';
  RAISE NOTICE '  carol@acme.com  / ChangeMe123!  (finance head)';
  RAISE NOTICE '  dave@acme.com   / ChangeMe123!  (payments maker + checker)';
  RAISE NOTICE '  eve@beta.com    / ChangeMe123!  (super admin — Beta SG)';
  RAISE NOTICE '========================================';

END $$;
