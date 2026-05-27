/**
 * RoleCode — canonical set of system roles, aligned with SoW Section 14
 * "User Roles and Access Control".
 *
 * A user may hold one or more roles subject to the segregation-of-duties rules
 * in Section 14.1 (enforced in service layer / approval workflow).
 */
export enum RoleCode {
  // Highest privilege; dual-control administrative operations
  SUPER_ADMIN = 'SUPER_ADMIN',

  // User management, master data, matrix & account configuration, balance overrides
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',

  // Initiators
  INITIATOR = 'INITIATOR', // Payments Initiator — vendor payments & incoming receipts
  HR_INITIATOR = 'HR_INITIATOR', // Bulk payroll, reimbursement, FnF

  // Approvers
  APPROVER = 'APPROVER', // Matrix-routed approver (mobile primary)
  PAYROLL_APPROVER = 'PAYROLL_APPROVER', // Batch-level payroll approval

  // Payments team
  PAYMENTS_MAKER = 'PAYMENTS_MAKER',
  PAYMENTS_CHECKER = 'PAYMENTS_CHECKER',
  PAYMENTS_HEAD = 'PAYMENTS_HEAD', // Approves chairman execution

  // Beneficiary change control (Section 6 maker-checker)
  BENEFICIARY_CHANGE_MAKER = 'BENEFICIARY_CHANGE_MAKER',
  BENEFICIARY_CHANGE_VERIFIER = 'BENEFICIARY_CHANGE_VERIFIER',

  // Oversight
  FINANCE_HEAD = 'FINANCE_HEAD', // Country / Entity Finance Head
  GROUP_TREASURER = 'GROUP_TREASURER', // Group Treasurer / CFO

  // Confidential payments
  CHAIRMAN = 'CHAIRMAN',

  // Read-only audit
  INTERNAL_AUDITOR = 'INTERNAL_AUDITOR',
}
