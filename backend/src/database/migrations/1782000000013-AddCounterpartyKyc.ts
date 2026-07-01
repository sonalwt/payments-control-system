import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Self-service counterparty creation with KYC routing. Non-admins can create
 * counterparties; trade additions are routed to the KYC team for approval
 * (kyc_status = PENDING), non-trade additions are usable immediately but
 * flagged (kyc_flagged). Existing rows default to APPROVED so they stay usable.
 */
export class AddCounterpartyKyc1782000000013 implements MigrationInterface {
  name = 'AddCounterpartyKyc1782000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "counterparties" ADD COLUMN IF NOT EXISTS "payment_nature" varchar(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "counterparties" ADD COLUMN IF NOT EXISTS "kyc_status" varchar(10) NOT NULL DEFAULT 'APPROVED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "counterparties" ADD COLUMN IF NOT EXISTS "kyc_flagged" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "counterparties" ADD COLUMN IF NOT EXISTS "kyc_reviewed_by" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "counterparties" ADD COLUMN IF NOT EXISTS "kyc_reviewed_at" timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "counterparties" ADD COLUMN IF NOT EXISTS "kyc_rejection_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "counterparties" ADD CONSTRAINT "chk_cp_kyc_status" CHECK ("kyc_status" IN ('PENDING', 'APPROVED', 'REJECTED'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "counterparties" DROP CONSTRAINT IF EXISTS "chk_cp_kyc_status"`);
    await queryRunner.query(`ALTER TABLE "counterparties" DROP COLUMN IF EXISTS "kyc_rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "counterparties" DROP COLUMN IF EXISTS "kyc_reviewed_at"`);
    await queryRunner.query(`ALTER TABLE "counterparties" DROP COLUMN IF EXISTS "kyc_reviewed_by"`);
    await queryRunner.query(`ALTER TABLE "counterparties" DROP COLUMN IF EXISTS "kyc_flagged"`);
    await queryRunner.query(`ALTER TABLE "counterparties" DROP COLUMN IF EXISTS "kyc_status"`);
    await queryRunner.query(`ALTER TABLE "counterparties" DROP COLUMN IF EXISTS "payment_nature"`);
  }
}
