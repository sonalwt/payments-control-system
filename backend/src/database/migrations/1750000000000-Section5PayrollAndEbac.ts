import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Section 5 — Payroll Batches & Employee Bank Account Change Control.
 * Must run after Section 6 because payroll_batch_items references
 * beneficiary_accounts.
 */
export class Section5PayrollAndEbac1750000000000 implements MigrationInterface {
  name = 'Section5PayrollAndEbac1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── payroll_batch_status enum ─────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_batch_status') THEN
          CREATE TYPE payroll_batch_status AS ENUM (
            'VALIDATION_FAILED','DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS payroll_batch_seq START 1;`,
    );

    // ── payroll_batches ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payroll_batches (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_number         TEXT NOT NULL UNIQUE,
        legal_entity_id      UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
        period_label         TEXT NOT NULL,
        currency_code        CHAR(3) NOT NULL,
        total_gross_minor    BIGINT NOT NULL DEFAULT 0,
        total_net_minor      BIGINT NOT NULL DEFAULT 0,
        employee_count       INT NOT NULL DEFAULT 0,
        variance_flag        BOOLEAN NOT NULL DEFAULT FALSE,
        headcount_delta      INT,
        sanity_notes         TEXT,
        status               payroll_batch_status NOT NULL DEFAULT 'DRAFT',
        file_url             TEXT NOT NULL,
        uploaded_by          UUID REFERENCES users(id),
        submitted_at         TIMESTAMPTZ,
        approved_by          UUID REFERENCES users(id),
        approved_at          TIMESTAMPTZ,
        rejected_by          UUID REFERENCES users(id),
        rejected_at          TIMESTAMPTZ,
        rejection_reason     TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at           TIMESTAMPTZ,
        created_by           UUID,
        updated_by           UUID
      );
    `);

    // ── payroll_batch_items ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payroll_batch_items (
        id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        batch_id                 UUID NOT NULL REFERENCES payroll_batches(id) ON DELETE CASCADE,
        employee_id              UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
        beneficiary_account_id   UUID REFERENCES beneficiary_accounts(id),
        gross_amount_minor       BIGINT NOT NULL,
        net_amount_minor         BIGINT NOT NULL,
        deductions_minor         BIGINT NOT NULL DEFAULT 0,
        payslip_url              TEXT,
        variance_flag            BOOLEAN NOT NULL DEFAULT FALSE,
        previous_net_minor       BIGINT,
        variance_pct             NUMERIC(6,2),
        payment_request_id       UUID REFERENCES payment_requests(id),
        created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // ── ebac_change_type + ebac_status enums ─────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ebac_change_type') THEN
          CREATE TYPE ebac_change_type AS ENUM ('ADD','MODIFY','DEACTIVATE');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ebac_status') THEN
          CREATE TYPE ebac_status AS ENUM (
            'PENDING_VERIFICATION','VERIFIED','APPROVED','REJECTED','CANCELLED'
          );
        END IF;
      END $$;
    `);

    // ── employee_bank_account_changes ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS employee_bank_account_changes (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id          UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
        change_type          ebac_change_type NOT NULL,
        status               ebac_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
        proposed_data        JSONB NOT NULL DEFAULT '{}',
        documents            JSONB NOT NULL DEFAULT '[]',
        anomaly_flag         BOOLEAN NOT NULL DEFAULT FALSE,
        anomaly_notes        TEXT,
        requested_by         UUID NOT NULL REFERENCES users(id),
        verified_by          UUID REFERENCES users(id),
        verified_at          TIMESTAMPTZ,
        verification_notes   TEXT,
        callback_evidence    TEXT,
        approved_by          UUID REFERENCES users(id),
        approved_at          TIMESTAMPTZ,
        rejected_by          UUID REFERENCES users(id),
        rejected_at          TIMESTAMPTZ,
        rejection_reason     TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at           TIMESTAMPTZ,
        created_by           UUID,
        updated_by           UUID,
        CONSTRAINT ebac_maker_checker CHECK (verified_by IS NULL OR verified_by <> requested_by)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS employee_bank_account_changes CASCADE;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS payroll_batch_items CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll_batches CASCADE;`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS payroll_batch_seq;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ebac_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ebac_change_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payroll_batch_status;`);
  }
}
