import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Introduce a dedicated `username` login handle, distinct from `full_name` and
 * `email`. Backfilled from the existing (unique) email so current accounts keep
 * working; admins can rename afterwards. Login moves from email to username;
 * email remains a normal, editable contact field.
 */
export class AddUsernameToUsers1782000000014 implements MigrationInterface {
  name = 'AddUsernameToUsers1782000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" citext`);
    await queryRunner.query(`UPDATE "users" SET "username" = "email" WHERE "username" IS NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_username" ON "users" ("username")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_username"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "username"`);
  }
}
