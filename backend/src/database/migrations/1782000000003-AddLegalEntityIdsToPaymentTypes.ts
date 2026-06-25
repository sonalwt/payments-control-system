import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A payment type may now belong to several legal entities. `legal_entity_ids`
 * becomes the source of truth (multi-select); the existing single
 * `legal_entity_id` is retained as a denormalised "primary" (kept in sync with
 * the first entry) for legacy single-entity consumers. Existing rows are
 * backfilled from their current legal_entity_id.
 */
export class AddLegalEntityIdsToPaymentTypes1782000000003
  implements MigrationInterface
{
  name = 'AddLegalEntityIdsToPaymentTypes1782000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_types" ADD COLUMN IF NOT EXISTS "legal_entity_ids" uuid[] NOT NULL DEFAULT '{}'`,
    );
    // Backfill the array from the existing single legal entity.
    await queryRunner.query(
      `UPDATE "payment_types"
          SET "legal_entity_ids" = ARRAY["legal_entity_id"]
        WHERE "legal_entity_id" IS NOT NULL
          AND ("legal_entity_ids" IS NULL OR "legal_entity_ids" = '{}')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_types" DROP COLUMN IF EXISTS "legal_entity_ids"`,
    );
  }
}
