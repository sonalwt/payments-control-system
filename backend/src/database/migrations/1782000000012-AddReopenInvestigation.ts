import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reopen-on-non-receipt. When a counterparty reports a completed payment was
 * never received, the initiator reopens the request, which routes it back to
 * the Treasury Team as UNDER_INVESTIGATION (resolved back to COMPLETED once the
 * team has investigated). Adds the status to the chk_pr_status check constraint
 * and the reopen-tracking columns.
 */
export class AddReopenInvestigation1782000000012 implements MigrationInterface {
  name = 'AddReopenInvestigation1782000000012';

  // Full current allowed set (mirrors the entity's PaymentRequestStatus).
  private readonly statuses = [
    'DRAFT',
    'PENDING_APPROVAL',
    'TREASURY_MAKER',
    'TREASURY_CHECKER',
    'TREASURY_AUTHORISER',
    'TREASURY_SWIFT',
    'AWAITING_CLOSURE',
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
    await queryRunner.query(this.buildCheck([...this.statuses, 'UNDER_INVESTIGATION']));

    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "reopen_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "reopened_at" timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD COLUMN IF NOT EXISTS "reopened_by" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_requests" DROP COLUMN IF EXISTS "reopened_by"`);
    await queryRunner.query(`ALTER TABLE "payment_requests" DROP COLUMN IF EXISTS "reopened_at"`);
    await queryRunner.query(`ALTER TABLE "payment_requests" DROP COLUMN IF EXISTS "reopen_reason"`);
    await queryRunner.query(`ALTER TABLE "payment_requests" DROP CONSTRAINT IF EXISTS "chk_pr_status"`);
    await queryRunner.query(this.buildCheck(this.statuses));
  }
}
