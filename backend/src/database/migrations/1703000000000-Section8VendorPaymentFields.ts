import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Section 8 — Vendor Payment: adds invoice_number and due_date columns
 * to payment_requests.
 */
export class Section8VendorPaymentFields1703000000000 implements MigrationInterface {
  name = 'Section8VendorPaymentFields1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'migration_section8.sql'),
      'utf8',
    );
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_payment_requests_invoice;`,
    );
    await queryRunner.query(
      `ALTER TABLE payment_requests DROP COLUMN IF EXISTS due_date;`,
    );
    await queryRunner.query(
      `ALTER TABLE payment_requests DROP COLUMN IF EXISTS invoice_number;`,
    );
  }
}
