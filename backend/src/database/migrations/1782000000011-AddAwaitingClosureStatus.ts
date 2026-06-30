import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * After the treasury maker uploads the SWIFT copy (executing the payment), the
 * request returns to the initiator to close it. Adds the AWAITING_CLOSURE
 * status to the chk_pr_status check constraint.
 */
export class AddAwaitingClosureStatus1782000000011
  implements MigrationInterface
{
  name = 'AddAwaitingClosureStatus1782000000011';

  private readonly statuses = [
    'DRAFT',
    'PENDING_APPROVAL',
    'TREASURY_MAKER',
    'TREASURY_CHECKER',
    'TREASURY_AUTHORISER',
    'TREASURY_SWIFT',
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
    await queryRunner.query(this.buildCheck([...this.statuses, 'AWAITING_CLOSURE']));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_requests" DROP CONSTRAINT IF EXISTS "chk_pr_status"`);
    await queryRunner.query(this.buildCheck(this.statuses));
  }
}
