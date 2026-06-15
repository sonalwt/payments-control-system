import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Section 2.2 — Foreign Exchange Rates.
 * Daily mid-rates fetched from OANDA (abstracted behind IRatesProvider), with
 * manual-override and stale-hold semantics. Idempotent so it coexists with the
 * raw `schema.sql` provisioning path.
 */
export class CreateFxRates1782000000000 implements MigrationInterface {
  name = 'CreateFxRates1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fx_rates" (
        "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "base_currency_code"  char(3)         NOT NULL,
        "quote_currency_code" char(3)         NOT NULL,
        "rate"                numeric(20,10)  NOT NULL,
        "as_of_date"          date            NOT NULL,
        "source"              varchar(20)     NOT NULL,
        "fetched_at"          timestamptz     NOT NULL DEFAULT now(),
        "provider_name"       varchar(50),
        "override_reason"     text,
        "created_at"          timestamptz     NOT NULL DEFAULT now(),
        "updated_at"          timestamptz     NOT NULL DEFAULT now(),
        "deleted_at"          timestamptz,
        "created_by"          uuid,
        "updated_by"          uuid,
        CONSTRAINT "chk_fx_rate_positive" CHECK ("rate" > 0),
        CONSTRAINT "chk_fx_rate_source"   CHECK ("source" IN ('OANDA','MANUAL_OVERRIDE','STALE_HELD')),
        CONSTRAINT "chk_fx_rate_base"     CHECK ("base_currency_code"  ~ '^[A-Z]{3}$'),
        CONSTRAINT "chk_fx_rate_quote"    CHECK ("quote_currency_code" ~ '^[A-Z]{3}$'),
        CONSTRAINT "uq_fx_rate_base_quote_asof" UNIQUE ("base_currency_code", "quote_currency_code", "as_of_date")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_fx_rates_quote_date" ON "fx_rates" ("quote_currency_code", "as_of_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_fx_rates_asof" ON "fx_rates" ("as_of_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fx_rates"`);
  }
}
