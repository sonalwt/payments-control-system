import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Section 9 — Chairman Payments
 *
 * Creates the chairman_beneficiaries and chairman_beneficiary_change_requests
 * tables, and extends payment_requests with the chairman-specific columns and
 * three new lifecycle statuses.
 */
export class Section9ChairmanPayments1755000000000 implements MigrationInterface {
  name = 'Section9ChairmanPayments1755000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Chairman beneficiaries master ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE chairman_beneficiaries (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_holder_name     VARCHAR(200) NOT NULL,
        account_number          VARCHAR(60)  NOT NULL,
        bank_id                 UUID NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
        bank_name               VARCHAR(150),
        branch_name             VARCHAR(120),
        swift_bic               VARCHAR(11),
        iban                    VARCHAR(34),
        currency_id             UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
        country_code            CHAR(2) NOT NULL,
        status                  VARCHAR(25) NOT NULL DEFAULT 'PENDING_ACTIVATION'
          CONSTRAINT chk_cb_status
            CHECK (status IN ('PENDING_ACTIVATION','ACTIVE','INACTIVE')),
        cooling_off_until       TIMESTAMPTZ,
        anomaly_flag            BOOLEAN NOT NULL DEFAULT FALSE,
        anomaly_notes           TEXT,
        sanction_warning        BOOLEAN NOT NULL DEFAULT FALSE,
        sanction_override_reason TEXT,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at              TIMESTAMPTZ,
        created_by              UUID,
        updated_by              UUID
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_cb_status ON chairman_beneficiaries (status)
    `);

    // ── 2. Chairman beneficiary change requests ──────────────────────────────
    await queryRunner.query(`
      CREATE TABLE chairman_beneficiary_change_requests (
        id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chairman_beneficiary_id     UUID REFERENCES chairman_beneficiaries(id) ON DELETE RESTRICT,
        change_type                 VARCHAR(12) NOT NULL
          CONSTRAINT chk_cbcr_type
            CHECK (change_type IN ('ADD','MODIFY','DEACTIVATE')),
        status                      VARCHAR(25) NOT NULL DEFAULT 'PENDING_VERIFICATION'
          CONSTRAINT chk_cbcr_status
            CHECK (status IN ('PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','CANCELLED')),
        proposed_data               JSONB NOT NULL DEFAULT '{}',
        documents                   JSONB NOT NULL DEFAULT '[]',
        anomaly_flag                BOOLEAN NOT NULL DEFAULT FALSE,
        anomaly_notes               TEXT,
        sanction_warning            BOOLEAN NOT NULL DEFAULT FALSE,
        sanction_override_reason    TEXT,
        requested_by                UUID NOT NULL,
        verified_by                 UUID,
        verified_at                 TIMESTAMPTZ,
        verification_notes          TEXT,
        callback_evidence           TEXT,
        approved_by                 UUID,
        approved_at                 TIMESTAMPTZ,
        rejected_by                 UUID,
        rejected_at                 TIMESTAMPTZ,
        rejection_reason            TEXT,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at                  TIMESTAMPTZ,
        created_by                  UUID,
        updated_by                  UUID,
        CONSTRAINT chk_cbcr_maker_checker
          CHECK (verified_by IS NULL OR verified_by <> requested_by)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_cbcr_status ON chairman_beneficiary_change_requests (status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_cbcr_reqby  ON chairman_beneficiary_change_requests (requested_by)
    `);

    // ── 3. Extend payment_requests ───────────────────────────────────────────
    // Add new columns (all nullable / defaulted so existing rows are unaffected)
    await queryRunner.query(`
      ALTER TABLE payment_requests
        ADD COLUMN is_chairman_payment     BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN chairman_beneficiary_id UUID REFERENCES chairman_beneficiaries(id)
                                             ON DELETE RESTRICT,
        ADD COLUMN maker_prepared_at       TIMESTAMPTZ,
        ADD COLUMN checker_verified_at     TIMESTAMPTZ,
        ADD COLUMN head_approved_at        TIMESTAMPTZ,
        ADD COLUMN checker_notes           TEXT
    `);

    // Drop the existing status CHECK constraint and re-create with the three
    // new chairman statuses. PostgreSQL does not support ALTER CONSTRAINT.
    await queryRunner.query(`
      ALTER TABLE payment_requests DROP CONSTRAINT chk_pr_status
    `);
    await queryRunner.query(`
      ALTER TABLE payment_requests ADD CONSTRAINT chk_pr_status CHECK (
        status IN (
          'DRAFT',
          'PENDING_APPROVAL',
          'APPROVED',
          'AWAITING_PAYMENT_CONFIRMATION',
          'PAID',
          'REJECTED',
          'WITHDRAWN',
          'CANCELLED',
          'AWAITING_MAKER_PREP',
          'AWAITING_CHECKER_REVIEW',
          'AWAITING_HEAD_APPROVAL'
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore original status constraint
    await queryRunner.query(`
      ALTER TABLE payment_requests DROP CONSTRAINT chk_pr_status
    `);
    await queryRunner.query(`
      ALTER TABLE payment_requests ADD CONSTRAINT chk_pr_status CHECK (
        status IN (
          'DRAFT',
          'PENDING_APPROVAL',
          'APPROVED',
          'AWAITING_PAYMENT_CONFIRMATION',
          'PAID',
          'REJECTED',
          'WITHDRAWN',
          'CANCELLED'
        )
      )
    `);

    // Remove chairman columns
    await queryRunner.query(`
      ALTER TABLE payment_requests
        DROP COLUMN IF EXISTS is_chairman_payment,
        DROP COLUMN IF EXISTS chairman_beneficiary_id,
        DROP COLUMN IF EXISTS maker_prepared_at,
        DROP COLUMN IF EXISTS checker_verified_at,
        DROP COLUMN IF EXISTS head_approved_at,
        DROP COLUMN IF EXISTS checker_notes
    `);

    // Drop change requests before beneficiaries (FK dependency)
    await queryRunner.query(`DROP TABLE IF EXISTS chairman_beneficiary_change_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS chairman_beneficiaries`);
  }
}
