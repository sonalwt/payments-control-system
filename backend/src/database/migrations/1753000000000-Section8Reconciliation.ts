import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SOW §8 — Bank Statement Reconciliation and Exception Management.
 *
 * Strictly additive:
 *   - Adds nullable reconciliation summary columns to the existing
 *     `statement_uploads` table. None are required; existing rows continue
 *     to work as-is and the existing upload flow (balance reset + amount
 *     lock) is unaffected.
 *   - Creates `statement_lines` for parsed entries.
 *   - Creates `reconciliation_exceptions` for unmatched lines.
 *
 * Every DDL statement uses IF NOT EXISTS / IF EXISTS guards so the migration
 * is safe to re-run and safe against partially-synchronised databases.
 */
export class Section8Reconciliation1753000000000 implements MigrationInterface {
  name = 'Section8Reconciliation1753000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── statement_uploads (additive) ─────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE statement_uploads
        ADD COLUMN IF NOT EXISTS ingestion_status         VARCHAR(20),
        ADD COLUMN IF NOT EXISTS ingestion_format         VARCHAR(10),
        ADD COLUMN IF NOT EXISTS ingestion_error          TEXT,
        ADD COLUMN IF NOT EXISTS auto_match_completed_at  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS matched_count            INTEGER,
        ADD COLUMN IF NOT EXISTS candidate_count          INTEGER,
        ADD COLUMN IF NOT EXISTS exception_count          INTEGER;
    `);

    // ── statement_lines ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS statement_lines (
        id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        statement_upload_id         UUID NOT NULL REFERENCES statement_uploads(id) ON DELETE CASCADE,
        bank_account_id             UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
        line_index                  INTEGER NOT NULL,
        value_date                  DATE NOT NULL,
        posting_date                DATE,
        direction                   VARCHAR(6) NOT NULL,
        amount                      NUMERIC(20,4) NOT NULL,
        currency_code               CHAR(3) NOT NULL,
        bank_reference              VARCHAR(100),
        counterparty_text           TEXT,
        narrative                   TEXT,
        running_balance             NUMERIC(20,4),
        match_status                VARCHAR(20) NOT NULL DEFAULT 'UNMATCHED',
        matched_payment_request_id  UUID REFERENCES payment_requests(id) ON DELETE SET NULL,
        matched_incoming_receipt_id UUID REFERENCES incoming_receipts(id) ON DELETE SET NULL,
        match_score                 NUMERIC(5,2),
        match_reason                TEXT,
        matched_at                  TIMESTAMPTZ,
        matched_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
        exception_id                UUID,
        raw_row                     JSONB,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_sl_direction CHECK (direction IN ('DEBIT','CREDIT')),
        CONSTRAINT chk_sl_match_status CHECK (
          match_status IN ('UNMATCHED','CANDIDATE','MATCHED','EXCEPTION')
        ),
        CONSTRAINT chk_sl_amount_positive CHECK (amount > 0),
        CONSTRAINT uq_sl_upload_index UNIQUE (statement_upload_id, line_index)
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sl_upload         ON statement_lines(statement_upload_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sl_account_date   ON statement_lines(bank_account_id, value_date DESC);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sl_match_status   ON statement_lines(match_status);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sl_pr             ON statement_lines(matched_payment_request_id) WHERE matched_payment_request_id IS NOT NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sl_ir             ON statement_lines(matched_incoming_receipt_id) WHERE matched_incoming_receipt_id IS NOT NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sl_bank_ref       ON statement_lines(bank_reference) WHERE bank_reference IS NOT NULL;`,
    );

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_statement_lines_touch ON statement_lines;`);
    await queryRunner.query(`
      CREATE TRIGGER trg_statement_lines_touch
        BEFORE UPDATE ON statement_lines
        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
    `);

    // ── reconciliation_exceptions ────────────────────────────────────────
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS reconciliation_exception_seq START 1 INCREMENT 1;`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reconciliation_exceptions (
        id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exception_number            VARCHAR(30) NOT NULL UNIQUE,
        statement_upload_id         UUID NOT NULL REFERENCES statement_uploads(id) ON DELETE CASCADE,
        statement_line_id           UUID NOT NULL UNIQUE REFERENCES statement_lines(id) ON DELETE CASCADE,
        bank_account_id             UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
        exception_type              VARCHAR(30) NOT NULL,
        status                      VARCHAR(30) NOT NULL DEFAULT 'OPEN',
        amount                      NUMERIC(20,4) NOT NULL,
        currency_code               CHAR(3) NOT NULL,
        value_date                  DATE NOT NULL,
        bank_reference              VARCHAR(100),
        counterparty_text           TEXT,
        narrative                   TEXT,
        resolution_note             TEXT,
        investigated_by             UUID REFERENCES users(id) ON DELETE SET NULL,
        investigated_at             TIMESTAMPTZ,
        resolved_by                 UUID REFERENCES users(id) ON DELETE SET NULL,
        resolved_at                 TIMESTAMPTZ,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_re_type   CHECK (exception_type IN ('UNAUTHORISED_PAYMENT','UNIDENTIFIED_RECEIPT')),
        CONSTRAINT chk_re_status CHECK (
          status IN ('OPEN','UNDER_INVESTIGATION','RESOLVED_WITH_JUSTIFICATION','CONFIRMED_EXCEPTION')
        )
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_re_status   ON reconciliation_exceptions(status);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_re_account  ON reconciliation_exceptions(bank_account_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_re_type     ON reconciliation_exceptions(exception_type);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_re_upload   ON reconciliation_exceptions(statement_upload_id);`,
    );

    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_reconciliation_exceptions_touch ON reconciliation_exceptions;`,
    );
    await queryRunner.query(`
      CREATE TRIGGER trg_reconciliation_exceptions_touch
        BEFORE UPDATE ON reconciliation_exceptions
        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
    `);

    // statement_lines.exception_id back-reference (FK added after the
    // exceptions table exists so we don't need a deferred constraint).
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_sl_exception'
        ) THEN
          ALTER TABLE statement_lines
            ADD CONSTRAINT fk_sl_exception
            FOREIGN KEY (exception_id)
            REFERENCES reconciliation_exceptions(id)
            ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sl_exception ON statement_lines(exception_id) WHERE exception_id IS NOT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE statement_lines DROP CONSTRAINT IF EXISTS fk_sl_exception;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS reconciliation_exceptions CASCADE;`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS reconciliation_exception_seq;`);
    await queryRunner.query(`DROP TABLE IF EXISTS statement_lines CASCADE;`);
    await queryRunner.query(`
      ALTER TABLE statement_uploads
        DROP COLUMN IF EXISTS ingestion_status,
        DROP COLUMN IF EXISTS ingestion_format,
        DROP COLUMN IF EXISTS ingestion_error,
        DROP COLUMN IF EXISTS auto_match_completed_at,
        DROP COLUMN IF EXISTS matched_count,
        DROP COLUMN IF EXISTS candidate_count,
        DROP COLUMN IF EXISTS exception_count;
    `);
  }
}
