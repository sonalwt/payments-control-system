-- =====================================================================
-- Payments Control System — Bank Account + Account Type Masters
-- Adds a SUPER_ADMIN-managed bank account master with:
--   bank_name, nickname, currency (FK), account_type (FK to new master),
--   account_number, branch_name, branch_code, opening_balance,
--   minimum_balance, status, is_chairman_designated.
-- Idempotent — safe to re-run on any prior state.
-- =====================================================================

CREATE TABLE IF NOT EXISTS account_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(80) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,
    created_by  UUID,
    updated_by  UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_account_types_name_live
    ON account_types(name)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_account_types_deleted_at
    ON account_types(deleted_at)
    WHERE deleted_at IS NULL;

-- Seed the three legacy enum values so existing bank_accounts rows can
-- map onto the new FK once back-filled.
INSERT INTO account_types(name)
VALUES ('Current'), ('Collateral'), ('Deposit')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- bank_accounts — extend in place with new master columns and relax
-- legacy NOT NULLs so SUPER_ADMIN can create entries without binding
-- to a legal entity or a banks-master row.
-- ---------------------------------------------------------------------

ALTER TABLE bank_accounts
    ADD COLUMN IF NOT EXISTS bank_name        VARCHAR(150),
    ADD COLUMN IF NOT EXISTS account_type_id  UUID REFERENCES account_types(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS opening_balance  DECIMAL(20,4);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='bank_accounts' AND column_name='legal_entity_id' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE bank_accounts ALTER COLUMN legal_entity_id DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='bank_accounts' AND column_name='bank_id' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE bank_accounts ALTER COLUMN bank_id DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='bank_accounts' AND column_name='account_type' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE bank_accounts ALTER COLUMN account_type DROP NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='bank_accounts' AND column_name='account_type_id' AND is_nullable='NO') THEN
        EXECUTE 'ALTER TABLE bank_accounts ALTER COLUMN account_type_id DROP NOT NULL';
    END IF;
END $$;

ALTER TABLE bank_accounts
    DROP CONSTRAINT IF EXISTS chk_bank_account_type,
    DROP CONSTRAINT IF EXISTS chk_bank_account_min_balance,
    DROP CONSTRAINT IF EXISTS uq_bank_account_number_per_bank;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_accounts_number_per_bankname_live
    ON bank_accounts(bank_name, account_number)
    WHERE deleted_at IS NULL AND bank_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_account_type_id
    ON bank_accounts(account_type_id)
    WHERE deleted_at IS NULL;
