import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The dev seed previously assigned `admin@radiant.com` *every* functional role
 * (Initiator, Checker, Ops Team, Treasury Team, …) "so a single login could
 * exercise every flow". That breaks segregation of duties — an administrator
 * should not also be every maker/checker/approver. The admin account is a
 * platform admin (is_platform_admin = TRUE), so the backend already grants
 * SUPER_ADMIN and bypasses the maker/checker/treasury role checks implicitly;
 * the functional roles are redundant.
 *
 * This strips every role except SUPER_ADMIN from any platform-admin user.
 * Irreversible by design (we will not re-grant the over-privileged roles).
 */
export class RemoveExtraAdminRoles1782000000005 implements MigrationInterface {
  name = 'RemoveExtraAdminRoles1782000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "user_roles" ur
        USING "users" u, "roles" r
       WHERE ur."user_id" = u."id"
         AND ur."role_id" = r."id"
         AND u."is_platform_admin" = TRUE
         AND r."code" <> 'SUPER_ADMIN'`,
    );
  }

  public async down(): Promise<void> {
    // No-op: restoring the over-privileged role assignments is intentionally
    // not supported.
  }
}
