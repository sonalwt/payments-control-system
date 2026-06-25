import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Append-only rejection history for payment requests. Each rejection (approval
 * chain or treasury stage) is recorded here so the trail survives resubmission,
 * which wipes the approval chain. Rows are never updated or deleted.
 */
export class AddPaymentRequestRejections1782000000006
  implements MigrationInterface
{
  name = 'AddPaymentRequestRejections1782000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payment_request_rejections" (
         "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
         "payment_request_id" uuid NOT NULL,
         "stage" varchar(30) NOT NULL,
         "step_order" integer,
         "attempt_no" integer NOT NULL DEFAULT 1,
         "rejected_by" uuid,
         "reason" text,
         "rejected_at" timestamptz NOT NULL DEFAULT now(),
         CONSTRAINT "pk_payment_request_rejections" PRIMARY KEY ("id"),
         CONSTRAINT "fk_prr_payment_request" FOREIGN KEY ("payment_request_id")
           REFERENCES "payment_requests"("id") ON DELETE CASCADE,
         CONSTRAINT "fk_prr_rejected_by" FOREIGN KEY ("rejected_by")
           REFERENCES "users"("id") ON DELETE SET NULL
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_prr_request_rejected_at"
         ON "payment_request_rejections" ("payment_request_id", "rejected_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "payment_request_rejections"`,
    );
  }
}
