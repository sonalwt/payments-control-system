import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The payment_requests.status column has a CHECK constraint (chk_pr_status)
 * enumerating the allowed statuses. The new TREASURY_SWIFT stage was missing
 * from it, so completing a standard payment (which routes to TREASURY_SWIFT)
 * failed. Recreate the constraint with TREASURY_SWIFT included.
 */
export class AddTreasurySwiftToStatusCheck1782000000010
  implements MigrationInterface
{
  name = 'AddTreasurySwiftToStatusCheck1782000000010';

  private readonly base = [
    'DRAFT',
    'PENDING_APPROVAL',
    'TREASURY_MAKER',
    'TREASURY_CHECKER',
    'TREASURY_AUTHORISER',
    'COMPLETED',
    'REJECTED',
    'WITHDRAWN',
    'CANCELLED',
    'AWAITING_MAKER_PREP',
    'AWAITING_CHECKER_REVIEW',
    'AWAITING_HEAD_APPROVAL',
  ];

  private buildCheck(values: string[]): string {
    const list = values.map((v) => `'${v}'`).join(', ');
    return `ALTER TABLE "payment_requests" ADD CONSTRAINT "chk_pr_status" CHECK ("status" IN (${list}))`;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_requests" DROP CONSTRAINT IF EXISTS "chk_pr_status"`);
    await queryRunner.query(this.buildCheck([...this.base, 'TREASURY_SWIFT']));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_requests" DROP CONSTRAINT IF EXISTS "chk_pr_status"`);
    await queryRunner.query(this.buildCheck(this.base));
  }
}
