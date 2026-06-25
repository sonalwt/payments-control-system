import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Group-chat / comment section for payment requests.
 *
 * Backs the PaymentRequestMessage entity. Until now the table only existed on
 * environments running with DB_SYNCHRONIZE=true; this migration creates it
 * explicitly so it is present where synchronize is off (e.g. production).
 *
 * Notes:
 *  - payment_request_id CASCADE-deletes with the parent PR (mirrors the entity).
 *  - sender_id / recipient_id RESTRICT so a user with chat history can't be
 *    hard-deleted out from under their messages (mirrors the entity).
 *  - recipient_id is nullable: group messages leave it null, it exists to
 *    support directed messages.
 *  - attachments is a jsonb array of { url, fileName } objects.
 */
export class AddPaymentRequestMessages1782000000012
  implements MigrationInterface
{
  name = 'AddPaymentRequestMessages1782000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "payment_request_messages" (
       "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
       "payment_request_id" uuid NOT NULL,
       "sender_id" uuid NOT NULL,
       "recipient_id" uuid,
       "message" text NOT NULL,
       "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
       "created_at" timestamptz NOT NULL DEFAULT now(),
       CONSTRAINT "pk_payment_request_messages" PRIMARY KEY ("id"),
       CONSTRAINT "fk_prm_payment_request" FOREIGN KEY ("payment_request_id")
         REFERENCES "payment_requests"("id") ON DELETE CASCADE,
       CONSTRAINT "fk_prm_sender" FOREIGN KEY ("sender_id")
         REFERENCES "users"("id") ON DELETE RESTRICT,
       CONSTRAINT "fk_prm_recipient" FOREIGN KEY ("recipient_id")
         REFERENCES "users"("id") ON DELETE RESTRICT
     )`);

    // The list/getMessages query filters by payment_request_id and orders by
    // created_at; the summary query groups by payment_request_id with MAX(created_at).
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_prm_request_created_at"
       ON "payment_request_messages" ("payment_request_id", "created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_request_messages"`);
  }
}
