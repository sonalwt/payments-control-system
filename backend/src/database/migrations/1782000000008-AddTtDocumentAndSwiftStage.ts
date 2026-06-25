import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Online TT flow rework: the treasury maker now uploads the Online TT document
 * (PDF) at submit, and after the authoriser completes the payment the request
 * returns to the maker (new TREASURY_SWIFT stage) to attach the SWIFT copy
 * before it is finally COMPLETED.
 *
 * Adds: tt_document_url, and the treasury_swift_by / treasury_swift_at stamps.
 * The TREASURY_SWIFT status itself needs no schema change (status is a varchar).
 */
export class AddTtDocumentAndSwiftStage1782000000008
  implements MigrationInterface
{
  name = 'AddTtDocumentAndSwiftStage1782000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "tt_document_url" varchar(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "treasury_swift_by" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "treasury_swift_at" timestamptz`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'fk_payment_requests_treasury_swift_by'
         ) THEN
           ALTER TABLE "payment_requests"
             ADD CONSTRAINT "fk_payment_requests_treasury_swift_by"
             FOREIGN KEY ("treasury_swift_by") REFERENCES "users"("id")
             ON DELETE SET NULL;
         END IF;
       END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_requests" DROP CONSTRAINT IF EXISTS "fk_payment_requests_treasury_swift_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_requests" DROP COLUMN IF EXISTS "treasury_swift_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_requests" DROP COLUMN IF EXISTS "treasury_swift_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_requests" DROP COLUMN IF EXISTS "tt_document_url"`,
    );
  }
}
