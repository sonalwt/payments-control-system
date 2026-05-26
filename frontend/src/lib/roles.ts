/**
 * Frontend mirror of the backend RoleCode enum (SoW Section 14).
 * Keep this list in sync with backend/src/common/enums/role.enum.ts.
 *
 * Used to gate sidebar navigation, route entry, and UI affordances so users
 * never see actions they cannot execute server-side.
 */
export const RoleCode = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  INITIATOR: 'INITIATOR',
  HR_INITIATOR: 'HR_INITIATOR',
  APPROVER: 'APPROVER',
  PAYROLL_APPROVER: 'PAYROLL_APPROVER',
  PAYMENTS_MAKER: 'PAYMENTS_MAKER',
  PAYMENTS_CHECKER: 'PAYMENTS_CHECKER',
  PAYMENTS_HEAD: 'PAYMENTS_HEAD',
  BENEFICIARY_CHANGE_MAKER: 'BENEFICIARY_CHANGE_MAKER',
  BENEFICIARY_CHANGE_VERIFIER: 'BENEFICIARY_CHANGE_VERIFIER',
  FINANCE_HEAD: 'FINANCE_HEAD',
  GROUP_TREASURER: 'GROUP_TREASURER',
  CHAIRMAN: 'CHAIRMAN',
  INTERNAL_AUDITOR: 'INTERNAL_AUDITOR',
} as const;

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];

/** Returns true when `userRoles` contains at least one of `allowedRoles`. */
export function hasAnyRole(
  userRoles: readonly string[] | undefined,
  allowedRoles: readonly RoleCode[],
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return allowedRoles.some((r) => userRoles.includes(r));
}

// ── Section 13/14 — per-area role bundles used by sidebar & route guards ────

/** Section 14 — Super/System Admin only. */
export const ADMIN_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SYSTEM_ADMIN,
];

/** Section 1 — organisation hierarchy & master data maintenance. */
export const MASTER_DATA_WRITE_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SYSTEM_ADMIN,
];

/** Section 1 — master data lookup screens (counterparties, employees, etc.). */
export const MASTER_DATA_READ_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SYSTEM_ADMIN,
  RoleCode.INITIATOR,
  RoleCode.HR_INITIATOR,
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.FINANCE_HEAD,
  RoleCode.GROUP_TREASURER,
  RoleCode.INTERNAL_AUDITOR,
];

/** Section 2 — banking, currency, account configuration. */
export const BANKING_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SYSTEM_ADMIN,
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.FINANCE_HEAD,
  RoleCode.GROUP_TREASURER,
  RoleCode.INTERNAL_AUDITOR,
];

/** Section 3/4/7 — payment & incoming receipt request lists. */
export const PAYMENT_REQUEST_VIEW_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SYSTEM_ADMIN,
  RoleCode.INITIATOR,
  RoleCode.HR_INITIATOR,
  RoleCode.APPROVER,
  RoleCode.PAYROLL_APPROVER,
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.FINANCE_HEAD,
  RoleCode.GROUP_TREASURER,
  RoleCode.CHAIRMAN,
  RoleCode.INTERNAL_AUDITOR,
];

/** Section 4 — vendor payment initiators (also incoming receipt initiators). */
export const PAYMENT_INITIATOR_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.INITIATOR,
  RoleCode.CHAIRMAN,
];

/** Section 5 — HR-led workflows. */
export const HR_WORKFLOW_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SYSTEM_ADMIN,
  RoleCode.HR_INITIATOR,
  RoleCode.PAYROLL_APPROVER,
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.FINANCE_HEAD,
  RoleCode.INTERNAL_AUDITOR,
];

/** Section 6 — beneficiary master & change requests. */
export const BENEFICIARY_VIEW_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SYSTEM_ADMIN,
  RoleCode.BENEFICIARY_CHANGE_MAKER,
  RoleCode.BENEFICIARY_CHANGE_VERIFIER,
  RoleCode.INITIATOR,
  RoleCode.HR_INITIATOR,
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.APPROVER,
  RoleCode.FINANCE_HEAD,
  RoleCode.INTERNAL_AUDITOR,
];

/** Section 8 — bank statement reconciliation & exception reports. */
export const RECONCILIATION_VIEW_ROLES: RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.SYSTEM_ADMIN,
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.FINANCE_HEAD,
  RoleCode.GROUP_TREASURER,
  RoleCode.INTERNAL_AUDITOR,
];

/** Section 9 — Chairman payment queue & beneficiary management. */
export const CHAIRMAN_PAYMENT_ROLES: RoleCode[] = [
  RoleCode.CHAIRMAN,
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.SUPER_ADMIN,
];

/** Section 9 — Roles that can manage chairman beneficiary change requests. */
export const CHAIRMAN_BENEFICIARY_ROLES: RoleCode[] = [
  RoleCode.CHAIRMAN,
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.SUPER_ADMIN,
];

/** Section 9 — Execution-only view (beneficiary queue, manage CRs). */
export const CHAIRMAN_EXECUTION_ROLES: RoleCode[] = [
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.SUPER_ADMIN,
];
