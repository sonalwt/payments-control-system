import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * §6 enhancements — adds anomaly detection fields, account_direction, and
 * sanction_override_reason. Safe to run on both existing and fresh databases
 * (all DDL uses IF NOT EXISTS / IF EXISTS guards).
 */
export class Section6Enhancements1751000000000 implements MigrationInterface {
  name = 'Section6Enhancements1751000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // §6.4 — anomaly detection fields on change requests
    await queryRunner.query(`
      ALTER TABLE beneficiary_account_change_requests
        ADD COLUMN IF NOT EXISTS anomaly_flag  BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS anomaly_notes TEXT;
    `);

    // §6.1 — account direction (PAY_TO / RECEIVE_FROM / BOTH)
    await queryRunner.query(`
      ALTER TABLE beneficiary_accounts
        ADD COLUMN IF NOT EXISTS account_direction VARCHAR(15) NOT NULL DEFAULT 'PAY_TO';
    `);

    // §6.5 — stores the final approver's written sanction acknowledgement
    await queryRunner.query(`
      ALTER TABLE payment_requests
        ADD COLUMN IF NOT EXISTS sanction_override_reason TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE payment_requests DROP COLUMN IF EXISTS sanction_override_reason;`,
    );
    await queryRunner.query(
      `ALTER TABLE beneficiary_accounts DROP COLUMN IF EXISTS account_direction;`,
    );
    await queryRunner.query(
      `ALTER TABLE beneficiary_account_change_requests DROP COLUMN IF EXISTS anomaly_notes;`,
    );
    await queryRunner.query(
      `ALTER TABLE beneficiary_account_change_requests DROP COLUMN IF EXISTS anomaly_flag;`,
    );
  }
}
