import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The country master no longer carries a default currency. Drops
 * countries.currency_id (and its FK). The down migration re-adds it as a
 * nullable column (the prior currency links are not restored).
 */
export class RemoveCurrencyFromCountries1782000000002
  implements MigrationInterface
{
  name = 'RemoveCurrencyFromCountries1782000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "countries" DROP COLUMN IF EXISTS "currency_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "currency_id" uuid`,
    );
  }
}
