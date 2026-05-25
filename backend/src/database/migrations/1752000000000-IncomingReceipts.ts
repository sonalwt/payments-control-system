import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SOW §7 — Incoming Receipts.
 *
 * Strictly additive: creates a dedicated `incoming_receipts` table plus a
 * documents child table and a sequence for human-readable numbering. The
 * existing `payment_requests` table and its status machine are not touched.
 *
 * Status flow:
 *   DRAFT --submit--> AWAITING_RECEIPT --mark-received--> RECEIVED
 *                                     \--cancel--> CANCELLED
 *
 * The credit on RECEIVED is applied via BankAccountsService.creditForReceipt,
 * which already exists in §2.5.
 */
export class IncomingReceipts1752000000000 implements MigrationInterface {
  name = 'IncomingReceipts1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS incoming_receipt_seq START 1 INCREMENT 1;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS incoming_receipts (
        id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_number           VARCHAR(30) NOT NULL UNIQUE,
        legal_entity_id          UUID NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
        counterparty_id          UUID NOT NULL REFERENCES counterparties(id) ON DELETE RESTRICT,
        receive_from_account_id  UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
        expected_amount          NUMERIC(20,4) NOT NULL,
        expected_currency_code   CHAR(3)       NOT NULL,
        purpose_description      TEXT,
        status                   VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
        submitted_at             TIMESTAMPTZ,
        received_at              TIMESTAMPTZ,
        received_amount          NUMERIC(20,4),
        received_currency_code   CHAR(3),
        inward_bank_reference    VARCHAR(100),
        received_remarks         TEXT,
        cancellation_reason      TEXT,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at               TIMESTAMPTZ,
        created_by               UUID,
        updated_by               UUID,
        CONSTRAINT chk_ir_status CHECK (status IN ('DRAFT','AWAITING_RECEIPT','RECEIVED','CANCELLED')),
        CONSTRAINT chk_ir_amount_positive CHECK (expected_amount > 0),
        CONSTRAINT chk_ir_currency CHECK (expected_currency_code ~ '^[A-Z]{3}$')
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ir_status         ON incoming_receipts(status)            WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ir_entity         ON incoming_receipts(legal_entity_id)   WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ir_counterparty   ON incoming_receipts(counterparty_id)   WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ir_account        ON incoming_receipts(receive_from_account_id) WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ir_created        ON incoming_receipts(created_at DESC)   WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ir_deleted        ON incoming_receipts(deleted_at)        WHERE deleted_at IS NULL;`);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_incoming_receipts_touch ON incoming_receipts;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_incoming_receipts_touch
        BEFORE UPDATE ON incoming_receipts
        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS incoming_receipt_documents (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        incoming_receipt_id  UUID NOT NULL REFERENCES incoming_receipts(id) ON DELETE CASCADE,
        document_code        VARCHAR(50) NOT NULL,
        document_label       VARCHAR(200),
        file_name            VARCHAR(255) NOT NULL,
        file_url             VARCHAR(500) NOT NULL,
        file_size_bytes      INTEGER,
        mime_type            VARCHAR(100),
        uploaded_by          UUID,
        uploaded_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ird_receipt ON incoming_receipt_documents(incoming_receipt_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS incoming_receipt_documents;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_incoming_receipts_touch ON incoming_receipts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS incoming_receipts;`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS incoming_receipt_seq;`);
  }
}
