import { MigrationInterface, QueryRunner } from 'typeorm';

/** The treasury checker can attach an optional note when marking a request checked. */
export class AddTreasuryCheckerComments1782000000009
  implements MigrationInterface
{
  name = 'AddTreasuryCheckerComments1782000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "treasury_checker_comments" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_requests" DROP COLUMN IF EXISTS "treasury_checker_comments"`,
    );
  }
}
