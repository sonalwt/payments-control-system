-- =====================================================================
-- Payments Control System — Chairman Payments (§9) Seed Data
-- Run standalone:
--   psql -U postgres -d pcs -f backend/src/database/seed_chairman_payments.sql
-- Or via npm:
--   npm run seed:all   (includes this file automatically)
--
-- IMPORTANT: Run  npm run migration:run  before executing this seed.
-- All inserts are idempotent (safe to run more than once).
-- =====================================================================

DO $$
DECLARE
  -- ── Roles ─────────────────────────────────────────────────────────
  v_role_chairman  UUID;
  v_role_maker     UUID;
  v_role_checker   UUID;
  v_role_phead     UUID;

  -- ── Existing master data (resolved from seed_dummy.sql) ───────────
  v_cur_aed        UUID;
  v_le_acme_ae     UUID;
  v_bank_enbd      UUID;

  -- ── Users ─────────────────────────────────────────────────────────
  v_usr_chairman   UUID;
  v_usr_maker      UUID;   -- dave@acme.com — already exists as PAYMENTS_MAKER
  v_usr_checker    UUID;   -- frank@acme.com — new PAYMENTS_CHECKER
  v_usr_phead      UUID;   -- george@acme.com — new PAYMENTS_HEAD

  -- ── Chairman-designated bank account ──────────────────────────────
  v_acc_chairman   UUID;

  -- ── Chairman beneficiaries ────────────────────────────────────────
  v_cb_active      UUID;   -- ACTIVE (cooling-off expired, ready to use)
  v_cb_pending     UUID;   -- PENDING_ACTIVATION (cooling-off still running)

BEGIN

  -- ----------------------------------------------------------------
  -- Resolve master data — must already exist from seed_dummy.sql
  -- ----------------------------------------------------------------
  SELECT id INTO v_cur_aed    FROM currencies     WHERE code        = 'AED';
  SELECT id INTO v_le_acme_ae FROM legal_entities WHERE code        = 'ACME-AE';
  SELECT id INTO v_bank_enbd  FROM banks           WHERE short_name = 'ENBD';

  IF v_cur_aed IS NULL OR v_le_acme_ae IS NULL OR v_bank_enbd IS NULL THEN
    RAISE EXCEPTION 'seed_dummy.sql must be run before seed_chairman_payments.sql';
  END IF;

  SELECT id INTO v_role_chairman FROM roles WHERE code = 'CHAIRMAN';
  SELECT id INTO v_role_maker    FROM roles WHERE code = 'PAYMENTS_MAKER';
  SELECT id INTO v_role_checker  FROM roles WHERE code = 'PAYMENTS_CHECKER';
  SELECT id INTO v_role_phead    FROM roles WHERE code = 'PAYMENTS_HEAD';

  -- Existing maker user (seeded by seed_dummy.sql)
  SELECT id INTO v_usr_maker FROM users WHERE email = 'dave@acme.com';

  -- ================================================================
  -- USERS  (password: ChangeMe123!)
  -- ================================================================

  -- chairman@acme.com  — CHAIRMAN role (submits confidential payments)
  INSERT INTO users(email, password_hash, full_name, employee_code, is_active)
  VALUES ('chairman@acme.com',
          crypt('ChangeMe123!', gen_salt('bf', 12)),
          'Chairman Ahmed Al-Rashid', 'CHR001', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_chairman;

  -- frank@acme.com — PAYMENTS_CHECKER (verifies chairman TT documents)
  INSERT INTO users(email, password_hash, full_name, employee_code, is_active)
  VALUES ('frank@acme.com',
          crypt('ChangeMe123!', gen_salt('bf', 12)),
          'Frank Patel', 'USR005', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_checker;

  -- george@acme.com — PAYMENTS_HEAD (gives final execution approval)
  INSERT INTO users(email, password_hash, full_name, employee_code, is_active)
  VALUES ('george@acme.com',
          crypt('ChangeMe123!', gen_salt('bf', 12)),
          'George Thompson', 'USR006', TRUE)
  ON CONFLICT (email) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_usr_phead;

  RAISE NOTICE '§9 — users (chairman, checker, head): done.';

  -- ================================================================
  -- USER-ENTITY-ROLE ASSIGNMENTS
  -- ================================================================
  INSERT INTO user_entity_roles(user_id, legal_entity_id, role_id, is_active)
  VALUES
    -- Chairman role for the chairman user
    (v_usr_chairman, v_le_acme_ae, v_role_chairman, TRUE),
    -- Payments team roles on ACME-AE
    (v_usr_maker,    v_le_acme_ae, v_role_maker,    TRUE),
    (v_usr_checker,  v_le_acme_ae, v_role_checker,  TRUE),
    (v_usr_phead,    v_le_acme_ae, v_role_phead,    TRUE)
  ON CONFLICT (user_id, legal_entity_id, role_id) DO NOTHING;

  RAISE NOTICE '§9 — user-entity-roles: done.';

  -- ================================================================
  -- §9.2  CHAIRMAN-DESIGNATED BANK ACCOUNT
  --   Segregated source account exclusively for chairman TT payments.
  --   is_chairman_designated = TRUE ensures standard maker release
  --   cannot pick this account (and vice versa).
  -- ================================================================
  INSERT INTO bank_accounts(
    nickname, legal_entity_id, bank_id, currency_id,
    account_number, account_type, branch_name,
    balance, balance_as_of, balance_source, minimum_balance,
    is_chairman_designated, is_active
  )
  VALUES (
    'ACME FZE — Chairman Confidential',
    v_le_acme_ae, v_bank_enbd, v_cur_aed,
    'ENBD200099000', 'CURRENT', 'Deira Main Branch',
    5000000.00, now(), 'SEEDED', 100000.00,
    TRUE, TRUE
  )
  ON CONFLICT (bank_id, account_number) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_acc_chairman;

  INSERT INTO balance_changes(
    account_id, kind, previous_balance, new_balance, delta, reason, changed_by
  )
  SELECT
    v_acc_chairman, 'MANUAL_OVERRIDE', 0, 5000000.00, 5000000.00,
    'Opening balance — chairman payment seed', v_usr_phead
  WHERE NOT EXISTS (
    SELECT 1 FROM balance_changes
    WHERE account_id = v_acc_chairman
      AND reason = 'Opening balance — chairman payment seed'
  );

  RAISE NOTICE '§9.2 — chairman-designated bank account (ENBD200099000): done.';

  -- ================================================================
  -- §9  CHAIRMAN BENEFICIARIES
  -- ================================================================

  -- 1. ACTIVE — cooling-off has elapsed; can be used immediately
  INSERT INTO chairman_beneficiaries(
    account_holder_name, account_number, bank_id, bank_name, branch_name,
    swift_bic, iban, currency_id, country_code,
    status, cooling_off_until,
    anomaly_flag, sanction_warning,
    created_by
  )
  SELECT
    'Sheikh Hamdan Investment Fund',
    'ENBD-CB-001001',
    v_bank_enbd, 'Emirates NBD Bank', 'Private Banking Branch',
    'EBILAEAD', 'AE070331234560000010010',
    v_cur_aed, 'AE',
    'ACTIVE', NULL,
    FALSE, FALSE,
    v_usr_chairman
  WHERE NOT EXISTS (
    SELECT 1 FROM chairman_beneficiaries
    WHERE account_number = 'ENBD-CB-001001' AND deleted_at IS NULL
  )
  RETURNING id INTO v_cb_active;

  IF v_cb_active IS NULL THEN
    SELECT id INTO v_cb_active
    FROM chairman_beneficiaries
    WHERE account_number = 'ENBD-CB-001001' AND deleted_at IS NULL;
  END IF;

  -- 2. PENDING_ACTIVATION — cooling-off still running (≈18 h remaining)
  --    Shows the "Cooling-Off Period Active" banner in the detail dialog.
  INSERT INTO chairman_beneficiaries(
    account_holder_name, account_number, bank_id, bank_name, branch_name,
    swift_bic, iban, currency_id, country_code,
    status, cooling_off_until,
    anomaly_flag, sanction_warning,
    created_by
  )
  SELECT
    'Al-Noor Capital Holdings',
    'ENBD-CB-002001',
    v_bank_enbd, 'Emirates NBD Bank', 'Corporate Banking',
    'EBILAEAD', 'AE070331234560000020010',
    v_cur_aed, 'AE',
    'PENDING_ACTIVATION', now() + INTERVAL '18 hours',
    FALSE, FALSE,
    v_usr_chairman
  WHERE NOT EXISTS (
    SELECT 1 FROM chairman_beneficiaries
    WHERE account_number = 'ENBD-CB-002001' AND deleted_at IS NULL
  )
  RETURNING id INTO v_cb_pending;

  IF v_cb_pending IS NULL THEN
    SELECT id INTO v_cb_pending
    FROM chairman_beneficiaries
    WHERE account_number = 'ENBD-CB-002001' AND deleted_at IS NULL;
  END IF;

  RAISE NOTICE '§9 — chairman beneficiaries (2 records): done.';

  -- ================================================================
  -- §9  PAYMENT REQUESTS — one per lifecycle stage
  --
  --   CHR-2026-001  AED  75,000   DRAFT
  --   CHR-2026-002  AED 120,000   AWAITING_MAKER_PREP
  --   CHR-2026-003  AED 250,000   AWAITING_CHECKER_REVIEW
  --   CHR-2026-004  AED 500,000   AWAITING_HEAD_APPROVAL
  --   CHR-2026-005  AED 1,000,000 AWAITING_PAYMENT_CONFIRMATION
  -- ================================================================

  -- ── 1. DRAFT — created by chairman, not yet submitted ─────────────
  INSERT INTO payment_requests(
    request_number, payment_type_code, legal_entity_id,
    currency_code, amount, amount_minor,
    purpose_description,
    status,
    is_chairman_payment, chairman_beneficiary_id,
    created_by
  )
  SELECT
    'CHR-2026-001', 'CHAIRMAN_PAYMENT', v_le_acme_ae,
    'AED', 75000.00, 7500000,
    'Q1 2026 Chairman Disbursement — Holdings Transfer',
    'DRAFT',
    TRUE, v_cb_active,
    v_usr_chairman
  WHERE NOT EXISTS (
    SELECT 1 FROM payment_requests WHERE request_number = 'CHR-2026-001'
  );

  -- ── 2. AWAITING_MAKER_PREP — submitted to payments team ───────────
  INSERT INTO payment_requests(
    request_number, payment_type_code, legal_entity_id,
    currency_code, amount, amount_minor,
    purpose_description,
    status, submitted_at,
    is_chairman_payment, chairman_beneficiary_id,
    beneficiary_snapshot,
    created_by
  )
  SELECT
    'CHR-2026-002', 'CHAIRMAN_PAYMENT', v_le_acme_ae,
    'AED', 120000.00, 12000000,
    'Board Resolution Payment — Feb 2026',
    'AWAITING_MAKER_PREP', now() - INTERVAL '2 days',
    TRUE, v_cb_active,
    jsonb_build_object(
      'accountHolderName', 'Sheikh Hamdan Investment Fund',
      'accountNumber',     'ENBD-CB-001001',
      'bankName',          'Emirates NBD Bank',
      'swiftBic',          'EBILAEAD',
      'iban',              'AE070331234560000010010',
      'currencyCode',      'AED',
      'countryCode',       'AE'
    ),
    v_usr_chairman
  WHERE NOT EXISTS (
    SELECT 1 FROM payment_requests WHERE request_number = 'CHR-2026-002'
  );

  -- ── 3. AWAITING_CHECKER_REVIEW — maker has prepared the TT ────────
  INSERT INTO payment_requests(
    request_number, payment_type_code, legal_entity_id,
    currency_code, amount, amount_minor,
    purpose_description,
    status, submitted_at, maker_prepared_at,
    source_account_id,
    is_chairman_payment, chairman_beneficiary_id,
    beneficiary_snapshot,
    maker_notes,
    created_by, updated_by
  )
  SELECT
    'CHR-2026-003', 'CHAIRMAN_PAYMENT', v_le_acme_ae,
    'AED', 250000.00, 25000000,
    'Annual Retainer — Strategic Partners Q4 2025',
    'AWAITING_CHECKER_REVIEW',
    now() - INTERVAL '5 days',
    now() - INTERVAL '3 days',
    v_acc_chairman,
    TRUE, v_cb_active,
    jsonb_build_object(
      'accountHolderName', 'Sheikh Hamdan Investment Fund',
      'accountNumber',     'ENBD-CB-001001',
      'bankName',          'Emirates NBD Bank',
      'swiftBic',          'EBILAEAD',
      'iban',              'AE070331234560000010010',
      'currencyCode',      'AED',
      'countryCode',       'AE'
    ),
    'TT details prepared. Documents uploaded. Beneficiary KYC on file.',
    v_usr_chairman, v_usr_maker
  WHERE NOT EXISTS (
    SELECT 1 FROM payment_requests WHERE request_number = 'CHR-2026-003'
  );

  -- ── 4. AWAITING_HEAD_APPROVAL — checker has verified documents ────
  INSERT INTO payment_requests(
    request_number, payment_type_code, legal_entity_id,
    currency_code, amount, amount_minor,
    purpose_description,
    status, submitted_at, maker_prepared_at, checker_verified_at,
    source_account_id,
    is_chairman_payment, chairman_beneficiary_id,
    beneficiary_snapshot,
    maker_notes, checker_notes,
    created_by, updated_by
  )
  SELECT
    'CHR-2026-004', 'CHAIRMAN_PAYMENT', v_le_acme_ae,
    'AED', 500000.00, 50000000,
    'Infrastructure Investment — Q2 2026 Tranche A',
    'AWAITING_HEAD_APPROVAL',
    now() - INTERVAL '8 days',
    now() - INTERVAL '6 days',
    now() - INTERVAL '4 days',
    v_acc_chairman,
    TRUE, v_cb_active,
    jsonb_build_object(
      'accountHolderName', 'Sheikh Hamdan Investment Fund',
      'accountNumber',     'ENBD-CB-001001',
      'bankName',          'Emirates NBD Bank',
      'swiftBic',          'EBILAEAD',
      'iban',              'AE070331234560000010010',
      'currencyCode',      'AED',
      'countryCode',       'AE'
    ),
    'Source account verified. Sufficient balance confirmed. TT instruction ready.',
    'Documents verified. Callback with chairman office completed. No anomalies detected.',
    v_usr_chairman, v_usr_checker
  WHERE NOT EXISTS (
    SELECT 1 FROM payment_requests WHERE request_number = 'CHR-2026-004'
  );

  -- ── 5. AWAITING_PAYMENT_CONFIRMATION — head approved; ready for bank ──
  INSERT INTO payment_requests(
    request_number, payment_type_code, legal_entity_id,
    currency_code, amount, amount_minor,
    purpose_description,
    status, submitted_at, maker_prepared_at, checker_verified_at, head_approved_at,
    source_account_id,
    is_chairman_payment, chairman_beneficiary_id,
    beneficiary_snapshot,
    maker_notes, checker_notes,
    created_by, updated_by
  )
  SELECT
    'CHR-2026-005', 'CHAIRMAN_PAYMENT', v_le_acme_ae,
    'AED', 1000000.00, 100000000,
    'Strategic Partnership Settlement — Al-Noor Holdings',
    'AWAITING_PAYMENT_CONFIRMATION',
    now() - INTERVAL '12 days',
    now() - INTERVAL '10 days',
    now() - INTERVAL '8 days',
    now() - INTERVAL '6 days',
    v_acc_chairman,
    TRUE, v_cb_active,
    jsonb_build_object(
      'accountHolderName', 'Sheikh Hamdan Investment Fund',
      'accountNumber',     'ENBD-CB-001001',
      'bankName',          'Emirates NBD Bank',
      'swiftBic',          'EBILAEAD',
      'iban',              'AE070331234560000010010',
      'currencyCode',      'AED',
      'countryCode',       'AE'
    ),
    'TT instruction complete. Amount confirmed with treasury.',
    'Full document pack verified. Beneficiary confirmed active.',
    v_usr_chairman, v_usr_phead
  WHERE NOT EXISTS (
    SELECT 1 FROM payment_requests WHERE request_number = 'CHR-2026-005'
  );

  RAISE NOTICE '§9 — chairman payment requests (5 records, all lifecycle stages): done.';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHAIRMAN PAYMENTS SEED COMPLETE (§9).';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'New login credentials (password: ChangeMe123!):';
  RAISE NOTICE '  chairman@acme.com  — CHAIRMAN';
  RAISE NOTICE '  frank@acme.com     — PAYMENTS_CHECKER';
  RAISE NOTICE '  george@acme.com    — PAYMENTS_HEAD';
  RAISE NOTICE '  dave@acme.com      — PAYMENTS_MAKER (existing)';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Chairman-designated bank account:';
  RAISE NOTICE '  ENBD200099000  ACME FZE — Chairman Confidential  AED 5,000,000';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Chairman beneficiaries:';
  RAISE NOTICE '  ENBD-CB-001001  Sheikh Hamdan Investment Fund  ACTIVE';
  RAISE NOTICE '  ENBD-CB-002001  Al-Noor Capital Holdings       PENDING_ACTIVATION (+18h)';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Payment requests:';
  RAISE NOTICE '  CHR-2026-001  AED    75,000   DRAFT';
  RAISE NOTICE '  CHR-2026-002  AED   120,000   AWAITING_MAKER_PREP';
  RAISE NOTICE '  CHR-2026-003  AED   250,000   AWAITING_CHECKER_REVIEW';
  RAISE NOTICE '  CHR-2026-004  AED   500,000   AWAITING_HEAD_APPROVAL';
  RAISE NOTICE '  CHR-2026-005  AED 1,000,000   AWAITING_PAYMENT_CONFIRMATION';
  RAISE NOTICE '========================================';

END $$;
