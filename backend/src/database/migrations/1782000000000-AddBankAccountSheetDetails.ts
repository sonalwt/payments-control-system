import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the correspondent-bank / SWIFT / IBAN / contact columns captured on the
 * group's bank-account master spreadsheet to the bank_accounts table.
 */
export class AddBankAccountSheetDetails1782000000000
  implements MigrationInterface
{
  name = 'AddBankAccountSheetDetails1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols: Array<[string, string]> = [
      ['account_holder_name', 'character varying(200)'],
      ['swift_bic', 'character varying(20)'],
      ['iban', 'character varying(60)'],
      ['bank_address', 'text'],
      ['correspondent_bank', 'text'],
      ['correspondent_swift', 'character varying(20)'],
      ['contact_name', 'character varying(150)'],
      ['contact_phone', 'character varying(40)'],
      ['contact_phone_alt', 'character varying(40)'],
      ['contact_email', 'character varying(150)'],
    ];
    for (const [name, type] of cols) {
      await queryRunner.query(
        `ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "${name}" ${type}`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      'account_holder_name',
      'swift_bic',
      'iban',
      'bank_address',
      'correspondent_bank',
      'correspondent_swift',
      'contact_name',
      'contact_phone',
      'contact_phone_alt',
      'contact_email',
    ];
    for (const name of cols) {
      await queryRunner.query(
        `ALTER TABLE "bank_accounts" DROP COLUMN IF EXISTS "${name}"`,
      );
    }
  }
}
