/**
 * Frontend mirror of the backend RoleCode enum and the `roles` table.
 *
 * Keep these three in lock-step:
 *   • backend/src/common/enums/role.enum.ts
 *   • this file
 *   • the `roles` table rows
 */
export const RoleCode = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  INITIATOR: 'INITIATOR',
  CHECKER: 'CHECKER',
  APPROVER_1: 'APPROVER_1',
  APPROVER_2: 'APPROVER_2',
  APPROVER: 'APPROVER',
  COUNTERPARTY: 'COUNTERPARTY',
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
