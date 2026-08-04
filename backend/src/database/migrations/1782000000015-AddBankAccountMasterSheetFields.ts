import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Second pass over the group's bank-account master spreadsheet. The first pass
 * (AddBankAccountSheetDetails) covered SWIFT/IBAN/correspondent/contact; the
 * sheet also carries clearing identifiers (ABA, bank code, sort code, customer
 * ID) and administrative contacts (fax, authorised signatory, registered mail
 * id) that had nowhere to live.
 *
 * Also widens three columns the real sheet overflows, and relaxes the
 * account-number uniqueness rule: banks routinely issue per-currency
 * sub-accounts that share one account number (e.g. Arab Bank 10722247 in both
 * USD and CHF), so currency is part of the account's identity.
 */
export class AddBankAccountMasterSheetFields1782000000015
  implements MigrationInterface
{
  name = 'AddBankAccountMasterSheetFields1782000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols: Array<[string, string]> = [
      ['aba_number', 'character varying(40)'],
      ['bank_code', 'character varying(50)'],
      ['sort_code', 'character varying(150)'],
      ['customer_id', 'character varying(60)'],
      ['fax', 'character varying(80)'],
      ['auth_signatory', 'character varying(200)'],
      ['registered_email', 'character varying(150)'],
    ];
    for (const [name, type] of cols) {
      await queryRunner.query(
        `ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "${name}" ${type}`,
      );
    }

    // The sheet's intermediary-swift cell often holds a full correspondent bank
    // description rather than a bare BIC, and some RM phone cells list two
    // numbers. Widen rather than truncate real data.
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ALTER COLUMN "correspondent_swift" TYPE character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ALTER COLUMN "contact_phone" TYPE character varying(60)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ALTER COLUMN "contact_phone_alt" TYPE character varying(60)`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_bank_accounts_bank_account_live"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_bank_accounts_bank_account_live"
         ON "bank_accounts" ("bank_id", "account_number", "currency_id")
       WHERE "deleted_at" IS NULL AND "bank_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_bank_accounts_bank_account_live"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_bank_accounts_bank_account_live"
         ON "bank_accounts" ("bank_id", "account_number")
       WHERE "deleted_at" IS NULL AND "bank_id" IS NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ALTER COLUMN "contact_phone_alt" TYPE character varying(40)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ALTER COLUMN "contact_phone" TYPE character varying(40)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bank_accounts" ALTER COLUMN "correspondent_swift" TYPE character varying(20)`,
    );

    const cols = [
      'aba_number',
      'bank_code',
      'sort_code',
      'customer_id',
      'fax',
      'auth_signatory',
      'registered_email',
    ];
    for (const name of cols) {
      await queryRunner.query(
        `ALTER TABLE "bank_accounts" DROP COLUMN IF EXISTS "${name}"`,
      );
    }
  }
}
