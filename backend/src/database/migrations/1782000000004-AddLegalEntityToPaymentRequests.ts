import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The Maker (initiator) now chooses the legal entity directly (and a currency
 * from that entity's bank accounts), while the source bank account is picked
 * later by the Treasury Maker. The legal entity is therefore stored on the
 * request itself so Treasury can filter bank accounts to it.
 *
 * Existing rows are backfilled from their source account's legal entity, since
 * previously the bank account (chosen by the maker) implied the entity.
 */
export class AddLegalEntityToPaymentRequests1782000000004
  implements MigrationInterface
{
  name = 'AddLegalEntityToPaymentRequests1782000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "legal_entity_id" uuid`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'fk_payment_requests_legal_entity'
         ) THEN
           ALTER TABLE "payment_requests"
             ADD CONSTRAINT "fk_payment_requests_legal_entity"
             FOREIGN KEY ("legal_entity_id") REFERENCES "legal_entities"("id")
             ON DELETE RESTRICT;
         END IF;
       END $$;`,
    );
    // Backfill from the source account's legal entity for in-flight requests.
    await queryRunner.query(
      `UPDATE "payment_requests" pr
          SET "legal_entity_id" = ba."legal_entity_id"
         FROM "bank_accounts" ba
        WHERE pr."source_account_id" = ba."id"
          AND pr."legal_entity_id" IS NULL
          AND ba."legal_entity_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_requests" DROP CONSTRAINT IF EXISTS "fk_payment_requests_legal_entity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_requests" DROP COLUMN IF EXISTS "legal_entity_id"`,
    );
  }
}
