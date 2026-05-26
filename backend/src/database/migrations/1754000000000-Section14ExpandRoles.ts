import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Section 14 — User Roles and Access Control.
 * Seeds the additional system roles defined by the Statement of Work so the
 * RolesGuard can enforce per-endpoint permissions for Sections 1–8 endpoints.
 *
 * Pre-existing roles (SUPER_ADMIN, INITIATOR, APPROVER, PAYMENTS_MAKER,
 * PAYMENTS_CHECKER, FINANCE_HEAD) are untouched. New roles are inserted
 * idempotently via ON CONFLICT (code).
 */
export class Section14ExpandRoles1754000000000 implements MigrationInterface {
  name = 'Section14ExpandRoles1754000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles(code, name, description, is_system) VALUES
        ('SYSTEM_ADMIN',                'System Administrator',
         'User management, master data, matrix and account configuration, sanctioned-country list, balance override',
         TRUE),
        ('HR_INITIATOR',                'HR Initiator',
         'Bulk-uploads payroll, creates reimbursement and FnF requests. No approval authority.',
         TRUE),
        ('PAYROLL_APPROVER',            'Payroll Approver',
         'Batch-level approval of payroll before processing',
         TRUE),
        ('PAYMENTS_HEAD',               'Payments Head',
         'Approves execution of chairman payments. Senior payments-team oversight.',
         TRUE),
        ('BENEFICIARY_CHANGE_MAKER',    'Beneficiary Change Maker',
         'Creates bank account change requests under maker-checker (cannot also verify)',
         TRUE),
        ('BENEFICIARY_CHANGE_VERIFIER', 'Beneficiary Change Verifier',
         'Verifies bank account change requests under maker-checker (cannot also create)',
         TRUE),
        ('GROUP_TREASURER',             'Group Treasurer / CFO',
         'Group-wide visibility and reporting; recipient for reconciliation exceptions',
         TRUE),
        ('CHAIRMAN',                    'Chairman',
         'Initiates chairman payments on mobile',
         TRUE),
        ('INTERNAL_AUDITOR',            'Internal Auditor',
         'Read-only access across the system, including the full audit log',
         TRUE)
      ON CONFLICT (code) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles WHERE code IN (
        'SYSTEM_ADMIN','HR_INITIATOR','PAYROLL_APPROVER','PAYMENTS_HEAD',
        'BENEFICIARY_CHANGE_MAKER','BENEFICIARY_CHANGE_VERIFIER',
        'GROUP_TREASURER','CHAIRMAN','INTERNAL_AUDITOR'
      );
    `);
  }
}
