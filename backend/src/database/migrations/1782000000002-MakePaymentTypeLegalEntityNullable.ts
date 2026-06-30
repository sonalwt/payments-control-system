import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Confidential (chairman-style) payment types bypass the approval matrix and
 * are not tied to a single legal entity, so legal_entity_id is now optional.
 * Non-confidential types still require one (enforced in the DTO/service layer).
 */
export class MakePaymentTypeLegalEntityNullable1782000000002
  implements MigrationInterface
{
  name = 'MakePaymentTypeLegalEntityNullable1782000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_types" ALTER COLUMN "legal_entity_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Backfill any nulls with the oldest legal entity before re-enforcing NOT NULL,
    // matching the original legal-entity migration's backfill rule.
    await queryRunner.query(
      `UPDATE "payment_types"
          SET "legal_entity_id" = (
            SELECT "id" FROM "legal_entities" ORDER BY "created_at", "id" LIMIT 1
          )
        WHERE "legal_entity_id" IS NULL`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM "payment_types" WHERE "legal_entity_id" IS NULL) THEN
           ALTER TABLE "payment_types" ALTER COLUMN "legal_entity_id" SET NOT NULL;
         END IF;
       END $$;`,
    );
  }
}
