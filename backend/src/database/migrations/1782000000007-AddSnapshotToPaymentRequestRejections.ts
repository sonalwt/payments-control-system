import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Store a full snapshot of the request's details at the moment of each
 * rejection, so the rejected version stays viewable even after the maker edits
 * and resubmits.
 */
export class AddSnapshotToPaymentRequestRejections1782000000007
  implements MigrationInterface
{
  name = 'AddSnapshotToPaymentRequestRejections1782000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_request_rejections" ADD COLUMN IF NOT EXISTS "snapshot" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_request_rejections" DROP COLUMN IF EXISTS "snapshot"`,
    );
  }
}
