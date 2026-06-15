import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceivedFromAccountToIncomingReceipts1781000000000
  implements MigrationInterface
{
  name = 'AddReceivedFromAccountToIncomingReceipts1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "incoming_receipts" ADD COLUMN IF NOT EXISTS "received_from_account" character varying(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "incoming_receipts" DROP COLUMN IF EXISTS "received_from_account"`,
    );
  }
}
