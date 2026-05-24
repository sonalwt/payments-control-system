import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Applies the base schema from schema.sql.
 * Section 5 payroll tables (payroll_batches, payroll_batch_items,
 * employee_bank_account_changes) are deliberately excluded here because
 * they reference beneficiary_accounts, which is created by the Section 6
 * migration that follows.
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const fullSql = fs.readFileSync(schemaPath, 'utf8');

    // Strip the Section 5 block and everything after it (those tables depend
    // on beneficiary_accounts, which the next migration will create).
    const section5Marker = '-- Section 5 \u2014 Payroll Batches';
    const cutIdx = fullSql.indexOf(section5Marker);
    const baseSql = cutIdx !== -1 ? fullSql.substring(0, cutIdx) : fullSql;

    await queryRunner.query(baseSql);

    // This index belongs to the payment_request_documents table defined above
    // but was written after the Section 5 block in schema.sql.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_prd_request ON payment_request_documents(payment_request_id);`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Reverting the full initial schema is destructive and must be handled
    // manually: DROP SCHEMA public CASCADE; CREATE SCHEMA public;
  }
}
