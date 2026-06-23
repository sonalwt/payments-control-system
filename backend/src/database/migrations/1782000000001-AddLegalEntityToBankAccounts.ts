import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Group-own bank accounts are now identified by the owning legal entity (used
 * as the account name) instead of a free-text nickname. The legal entity's name
 * is mirrored into bank_nickname so existing display/search/ordering keep working.
 */
export class AddLegalEntityToBankAccounts1782000000001
  implements MigrationInterface
{
  name = 'AddLegalEntityToBankAccounts1782000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "legal_entity_id" uuid`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'fk_bank_accounts_legal_entity'
         ) THEN
           ALTER TABLE "bank_accounts"
             ADD CONSTRAINT "fk_bank_accounts_legal_entity"
             FOREIGN KEY ("legal_entity_id") REFERENCES "legal_entities"("id")
             ON DELETE SET NULL;
         END IF;
       END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" DROP CONSTRAINT IF EXISTS "fk_bank_accounts_legal_entity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" DROP COLUMN IF EXISTS "legal_entity_id"`,
    );
  }
}
