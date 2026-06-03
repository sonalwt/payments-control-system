/**
 * RoleCode — canonical set of system roles.
 *
 * Mirrors the `roles` table in the database. Keep the two in sync: any code
 * referenced by `@Roles(RoleCode.X)` MUST exist as a row in `roles` or no
 * user can hold it.
 */
export enum RoleCode {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INITIATOR = 'INITIATOR',
  CHECKER = 'CHECKER',
  APPROVER_1 = 'APPROVER_1',
  APPROVER_2 = 'APPROVER_2',
  APPROVER = 'APPROVER',
  COUNTERPARTY = 'COUNTERPARTY',
  TREASURY_MAKER_ONLINE = 'TREASURY_MAKER_ONLINE',
  TREASURY_MAKER_OFFLINE = 'TREASURY_MAKER_OFFLINE',
  TREASURY_CHECKER = 'TREASURY_CHECKER',
  TREASURY_AUTHORISER = 'TREASURY_AUTHORISER',
}
