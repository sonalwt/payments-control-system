import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSanctionedCountries1749000000000 implements MigrationInterface {
  name = 'AddSanctionedCountries1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE sanctioned_countries (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        country_code    CHAR(2)       NOT NULL,
        country_name    VARCHAR(120)  NOT NULL,
        reason          TEXT          NOT NULL,
        is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
        deleted_at      TIMESTAMPTZ,
        created_by      UUID,
        updated_by      UUID,
        CONSTRAINT chk_sanctioned_country_code CHECK (country_code ~ '^[A-Z]{2}$')
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_sanctioned_country_code_live
        ON sanctioned_countries(country_code)
        WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX idx_sanctioned_countries_active
        ON sanctioned_countries(is_active)
        WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX idx_sanctioned_countries_deleted_at
        ON sanctioned_countries(deleted_at)
        WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_sanctioned_countries_touch
        BEFORE UPDATE ON sanctioned_countries
        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sanctioned_countries CASCADE;`);
  }
}
