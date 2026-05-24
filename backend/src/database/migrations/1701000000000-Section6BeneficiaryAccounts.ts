import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Section 6 — Beneficiary Master & Bank Account Change Control.
 * Creates beneficiary_accounts and beneficiary_account_change_requests tables,
 * adds beneficiary_account_id to payment_requests, and back-fills the FK
 * from employees.employee_bank_account_id.
 */
export class Section6BeneficiaryAccounts1701000000000 implements MigrationInterface {
  name = 'Section6BeneficiaryAccounts1701000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'migration_section6.sql'),
      'utf8',
    );
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE payment_requests DROP COLUMN IF EXISTS beneficiary_account_id;`,
    );
    await queryRunner.query(
      `ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employee_bene_account;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS beneficiary_account_change_requests CASCADE;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS beneficiary_accounts CASCADE;`);
  }
}
