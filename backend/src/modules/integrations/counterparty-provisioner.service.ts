import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Bank } from '../banks/bank.entity';
import { BeneficiaryAccount } from '../beneficiary-accounts/beneficiary-account.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { Country } from '../countries/country.entity';
import { InvoiceWebhookDto } from './dto/invoice-webhook.dto';

/**
 * New accounts are unusable for this long after creation, matching the window
 * an approved beneficiary change request applies (beneficiary-accounts.service).
 */
const COOLING_OFF_HOURS = 24;

export interface ProvisionResult {
  counterpartyName: string;
  counterpartyCode: string;
  /** Null when the invoice's bank could not be identified — see accountSkippedReason. */
  beneficiaryAccountId: string | null;
  accountSkippedReason?: string;
}

/**
 * Creates a supplier that PCS has never seen, from an inbound invoice.
 *
 * Everything it creates is born UNUSABLE and stays that way until a person
 * approves it through the existing controls:
 *
 *   - the counterparty is PENDING KYC, and submit() refuses any request whose
 *     counterparty is not APPROVED;
 *   - the bank account is PENDING_ACTIVATION with a cooling-off window, and
 *     isPayable() requires ACTIVE and elapsed cooling-off.
 *
 * So a payment can never leave on records this service created without a human
 * having reviewed both. The caller is responsible for only invoking it when
 * NOTHING in the master resembles the name — a near miss must go to a human,
 * because a lookalike of an approved vendor carrying different bank details is
 * the classic invoice-fraud pattern.
 */
@Injectable()
export class CounterpartyProvisioner {
  private readonly logger = new Logger(CounterpartyProvisioner.name);

  constructor(
    @InjectRepository(Bank) private readonly banks: Repository<Bank>,
    @InjectRepository(Country) private readonly countries: Repository<Country>,
    private readonly dataSource: DataSource,
  ) {}

  async provision(dto: InvoiceWebhookDto, currencyId: string): Promise<ProvisionResult> {
    const supplied = dto.supplierBankAccount;
    // Resolved before the transaction: a bank PCS does not hold is a reason to
    // skip the account, never a reason to invent a bank.
    const bank = await this.findBank(supplied.swiftBic, supplied.bankName);
    const countryId = await this.findCountryId(supplied.countryCode, bank);

    return this.dataSource.transaction(async (em) => {
      const code = await this.uniqueCode(em, dto.counterpartyName);
      const counterparty = await em.save(
        em.create(Counterparty, {
          code,
          name: dto.counterpartyName,
          legalName: dto.counterpartyName,
          role: 'VENDOR',
          countryId: countryId ?? null,
          isActive: true,
          // The control that stops this being paid. Do not default it away.
          kycStatus: 'PENDING',
          kycDone: false,
          notes:
            `Created automatically from ${dto.externalSystem} invoice ${dto.externalInvoiceId} ` +
            `(deal ${dto.dealId}) because no counterparty resembled this name. ` +
            'Verify the supplier and its bank details independently of the invoice before approving KYC.',
        }),
      );

      const result: ProvisionResult = {
        counterpartyName: counterparty.name,
        counterpartyCode: counterparty.code,
        beneficiaryAccountId: null,
      };

      if (!bank) {
        result.accountSkippedReason =
          `The bank on the invoice (${supplied.bankName ?? supplied.swiftBic ?? 'not stated'}) ` +
          'is not in the PCS bank master, so no account was created. Add the account manually.';
        return result;
      }
      if (!countryId) {
        result.accountSkippedReason =
          'The account country could not be determined, so no account was created. Add it manually.';
        return result;
      }

      // Bank accounts are unique per (bank, account number) across the whole
      // master — uq_bene_bank_account_live — not per counterparty. Hitting that
      // means this account is already on file under a different supplier, which
      // is worth a person's attention: either the supplier already exists under
      // another name, or two "suppliers" are quoting the same account. Report it
      // rather than inserting a duplicate or failing the invoice.
      const accountNumber = supplied.accountNumber ?? supplied.iban ?? '';
      const existing = await em.findOne(BeneficiaryAccount, {
        where: { bankId: bank.id, accountNumber },
        relations: ['counterparty'],
      });
      if (existing) {
        result.accountSkippedReason =
          `Account ${accountNumber} at ${bank.name} is already on file for ` +
          `"${existing.counterparty?.name ?? 'another counterparty'}". No account was created. ` +
          'Confirm whether this is the same supplier under a different name before approving.';
        return result;
      }

      const account = await em.save(
        em.create(BeneficiaryAccount, {
          counterpartyId: counterparty.id,
          accountHolderName: supplied.accountName,
          accountNumber,
          iban: supplied.iban ?? null,
          swiftBic: supplied.swiftBic ?? null,
          bankId: bank.id,
          currencyId,
          countryId,
          accountDirection: 'PAY_TO',
          // Unusable until someone activates it, then still held by cooling-off.
          status: 'PENDING_ACTIVATION',
          coolingOffUntil: new Date(Date.now() + COOLING_OFF_HOURS * 3600 * 1000),
        }),
      );
      result.beneficiaryAccountId = account.id;

      this.logger.warn(
        `Provisioned counterparty ${code} (PENDING KYC) and account ${account.id} ` +
          `(PENDING_ACTIVATION) from ${dto.externalSystem} invoice ${dto.externalInvoiceId}.`,
      );
      return result;
    });
  }

  /** SWIFT/BIC is the reliable key; the bank name is a fallback, exact only. */
  private async findBank(swiftBic?: string, bankName?: string): Promise<Bank | null> {
    if (swiftBic) {
      const bySwift = await this.banks
        .createQueryBuilder('b')
        .where('b.isActive = true')
        .andWhere('UPPER(TRIM(b.swiftBic)) = :s', { s: swiftBic.trim().toUpperCase() })
        .getOne();
      if (bySwift) return bySwift;
    }
    if (bankName) {
      const byName = await this.banks
        .createQueryBuilder('b')
        .where('b.isActive = true')
        .andWhere('LOWER(TRIM(b.name)) = :n', { n: bankName.trim().toLowerCase() })
        .getMany();
      if (byName.length === 1) return byName[0];
    }
    return null;
  }

  private async findCountryId(countryCode?: string, bank?: Bank | null): Promise<string | null> {
    if (countryCode) {
      const country = await this.countries.findOne({
        where: { code: countryCode.trim().toUpperCase() },
        select: ['id'],
      });
      if (country) return country.id;
    }
    // The bank's own country is a sound fallback for where the account is held.
    return bank?.countryId ?? null;
  }

  /**
   * Counterparty codes are uniquely indexed on live rows. The INT- prefix makes
   * integration-provisioned suppliers obvious in the master and in the KYC queue.
   */
  private async uniqueCode(
    em: { query: (sql: string, params: unknown[]) => Promise<unknown> },
    name: string,
  ): Promise<string> {
    const slug =
      name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30) || 'SUPPLIER';
    const base = `INT-${slug}`;
    for (let suffix = 0; suffix < 100; suffix += 1) {
      const code = suffix === 0 ? base : `${base}-${suffix}`;
      const taken = (await em.query(
        `SELECT 1 FROM counterparties WHERE code = $1 AND deleted_at IS NULL LIMIT 1`,
        [code],
      )) as unknown[];
      if (taken.length === 0) return code;
    }
    // Unreachable in practice; keeps the unique index authoritative rather than
    // looping forever on a pathological name collision.
    return `${base}-${Date.now().toString().slice(-6)}`;
  }
}
