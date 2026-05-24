import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApprovalMatrices1748000000000 implements MigrationInterface {
  name = 'AddApprovalMatrices1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE approval_matrices (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                  VARCHAR(150) NOT NULL,
        description           TEXT,
        payment_type_code     VARCHAR(50)  NOT NULL,
        version               INT          NOT NULL,
        status                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
        effective_from        DATE         NOT NULL,
        effective_to          DATE,
        published_at          TIMESTAMPTZ,
        published_by          UUID,
        is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
        deleted_at            TIMESTAMPTZ,
        created_by            UUID,
        updated_by            UUID,
        CONSTRAINT chk_approval_matrix_status     CHECK (status IN ('DRAFT','PUBLISHED','SUPERSEDED')),
        CONSTRAINT chk_approval_matrix_effective  CHECK (effective_to IS NULL OR effective_to >= effective_from),
        CONSTRAINT uq_approval_matrix_pt_version  UNIQUE (payment_type_code, version)
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_am_payment_type ON approval_matrices(payment_type_code) WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX idx_am_status       ON approval_matrices(status)            WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX idx_am_effective    ON approval_matrices(effective_from)    WHERE deleted_at IS NULL;`);
    await queryRunner.query(`CREATE INDEX idx_am_deleted_at   ON approval_matrices(deleted_at)        WHERE deleted_at IS NULL;`);

    await queryRunner.query(`
      CREATE TABLE approval_matrix_bands (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        matrix_id             UUID NOT NULL REFERENCES approval_matrices(id) ON DELETE CASCADE,
        currency_code         CHAR(3) NOT NULL,
        min_amount_minor      BIGINT  NOT NULL,
        max_amount_minor      BIGINT,
        sort_order            INT     NOT NULL DEFAULT 0,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_band_amounts CHECK (
          min_amount_minor >= 0
          AND (max_amount_minor IS NULL OR max_amount_minor >= min_amount_minor)
        ),
        CONSTRAINT uq_band_per_matrix_currency_min UNIQUE (matrix_id, currency_code, min_amount_minor)
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_amb_matrix   ON approval_matrix_bands(matrix_id);`);
    await queryRunner.query(`CREATE INDEX idx_amb_currency ON approval_matrix_bands(matrix_id, currency_code);`);

    await queryRunner.query(`
      CREATE TABLE approval_matrix_steps (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        band_id               UUID NOT NULL REFERENCES approval_matrix_bands(id) ON DELETE CASCADE,
        step_order            INT  NOT NULL,
        approver_type         VARCHAR(10) NOT NULL,
        approver_user_id      UUID REFERENCES users(id) ON DELETE RESTRICT,
        approver_role_id      UUID REFERENCES roles(id) ON DELETE RESTRICT,
        is_optional           BOOLEAN NOT NULL DEFAULT FALSE,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_step_type CHECK (approver_type IN ('USER','ROLE')),
        CONSTRAINT chk_step_target CHECK (
          (approver_type = 'USER' AND approver_user_id IS NOT NULL AND approver_role_id IS NULL)
          OR
          (approver_type = 'ROLE' AND approver_role_id IS NOT NULL AND approver_user_id IS NULL)
        ),
        CONSTRAINT uq_step_per_band UNIQUE (band_id, step_order)
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_ams_band ON approval_matrix_steps(band_id);`);
    await queryRunner.query(`CREATE INDEX idx_ams_user ON approval_matrix_steps(approver_user_id);`);
    await queryRunner.query(`CREATE INDEX idx_ams_role ON approval_matrix_steps(approver_role_id);`);

    await queryRunner.query(`CREATE TRIGGER trg_approval_matrices_touch       BEFORE UPDATE ON approval_matrices       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();`);
    await queryRunner.query(`CREATE TRIGGER trg_approval_matrix_bands_touch   BEFORE UPDATE ON approval_matrix_bands   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();`);
    await queryRunner.query(`CREATE TRIGGER trg_approval_matrix_steps_touch   BEFORE UPDATE ON approval_matrix_steps   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS approval_matrix_steps CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS approval_matrix_bands CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS approval_matrices CASCADE;`);
  }
}
