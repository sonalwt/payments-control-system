import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Section 7 — Proof-of-Payment Exception Reports.
 * Creates exception_reports and exception_report_items tables used by the
 * nightly cron job that flags unpaid payment requests.
 */
export class Section7ExceptionReports1702000000000 implements MigrationInterface {
  name = 'Section7ExceptionReports1702000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'migration_section7.sql'),
      'utf8',
    );
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS exception_report_items CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS exception_reports CASCADE;`);
  }
}
