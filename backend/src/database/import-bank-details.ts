/**
 * Imports the group's "Bank Details" master spreadsheet into the PCS masters.
 *
 *   npm run import:bank-details -- "C:\path\to\Bank_Details.xlsx"
 *
 * The workbook has one row per bank account, spread over several sheets with
 * slightly different column layouts. It carries no country column, so country
 * is derived from the SWIFT/BIC (characters 5-6 are the ISO-3166 country code)
 * and currency from the account-currency column, per the import brief.
 *
 * The import populates, in dependency order:
 *   countries -> currencies -> legal entities (Account Name)
 *             -> banks (Bank Name) -> bank accounts (one per sheet row)
 *
 * It is idempotent: masters are matched on their natural key and accounts on
 * (bank, account number, currency), so re-running updates rather than
 * duplicates.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';
import dataSource from './data-source';
import { Country } from '../modules/countries/country.entity';
import { Currency } from '../modules/currencies/currency.entity';
import { LegalEntity } from '../modules/legal-entities/legal-entity.entity';
import { Bank } from '../modules/banks/bank.entity';
import { BankAccount } from '../modules/bank-accounts/bank-account.entity';
import { AccountType } from '../modules/account-types/account-type.entity';

// ---------------------------------------------------------------------------
// Sheet layouts
// ---------------------------------------------------------------------------

/**
 * The workbook uses two column layouts that differ only by an ABA column
 * inserted after the account number, which shifts everything after it by one.
 * The layouts are NOT one-per-sheet: rows were pasted between sheets, so the
 * "red" sheet in particular holds rows of both kinds. Layout is therefore
 * detected per row (see pickLayout).
 */

/** Layout without the ABA column — SWIFT lands in column 8 (index 7). */
const BASE_LAYOUT = [
  'accountName', 'bankName', 'currency', 'accountNumber', 'iban', 'branchCode',
  'bankCode', 'swift', 'bankAddress', 'sortCode', 'customerId',
  'intermediaryBank', 'intermediarySwift', 'fax', 'rm', 'rmTel', 'rmMobile',
  'rmEmail', 'authSignatory', 'registeredEmail',
] as const;

/** Layout with the ABA column — SWIFT lands in column 9 (index 8). */
const ABA_LAYOUT = [
  'accountName', 'bankName', 'currency', 'accountNumber', 'aba', 'iban',
  'branchCode', 'bankCode', 'swift', 'bankAddress', 'sortCode', 'customerId',
  'intermediaryBank', 'intermediarySwift', 'fax', 'rm', 'rmTel', 'rmMobile',
  'rmEmail', 'authSignatory',
] as const;

/** Index of the `swift` key in each layout — the discriminator between them. */
const BASE_SWIFT_COL = BASE_LAYOUT.indexOf('swift' as never);
const ABA_SWIFT_COL = ABA_LAYOUT.indexOf('swift' as never);

type ColumnKey =
  | (typeof BASE_LAYOUT)[number]
  | (typeof ABA_LAYOUT)[number];

type SheetRow = Partial<Record<ColumnKey, string>> & { _sheet: string };

interface SheetSpec {
  /** Used when a row carries no BIC to detect its layout from. */
  defaultLayout: readonly ColumnKey[];
  /** 1-based row the data starts on (sheets have differing header blocks). */
  firstDataRow: number;
}

const SHEETS: Record<string, SheetSpec> = {
  Companies: { defaultLayout: BASE_LAYOUT, firstDataRow: 2 },
  red: { defaultLayout: BASE_LAYOUT, firstDataRow: 3 },
  Movies: { defaultLayout: ABA_LAYOUT, firstDataRow: 4 },
  // The Personal sheet has no ABA column; its one extra trailing column
  // ("Address") is empty throughout, so the base layout reads it correctly.
  Personal: { defaultLayout: BASE_LAYOUT, firstDataRow: 2 },
};

/**
 * Only "Companies" holds the group's own bank accounts. The other sheets are
 * separate datasets — third parties ("red"), another business line ("Movies")
 * and individuals ("Personal") — and none of their account holders belong in
 * the group's legal-entity master. Import them explicitly with
 * `--sheets=Companies,red` if that ever changes.
 */
const DEFAULT_SHEETS = ['Companies'];

/**
 * Pick a row's layout from where its SWIFT/BIC actually sits, falling back to
 * the sheet's usual layout for rows that carry no recognisable BIC.
 */
function pickLayout(
  cells: unknown[],
  fallback: readonly ColumnKey[],
): readonly ColumnKey[] {
  const atBase = isBic(cells[BASE_SWIFT_COL]);
  const atAba = isBic(cells[ABA_SWIFT_COL]);
  if (atBase && !atAba) return BASE_LAYOUT;
  if (atAba && !atBase) return ABA_LAYOUT;
  return fallback;
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

/** ISO-3166 alpha-2 -> country name, for every code the workbook can yield. */
const COUNTRY_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates', AT: 'Austria', AU: 'Australia', BE: 'Belgium',
  BH: 'Bahrain', CA: 'Canada', CH: 'Switzerland', CN: 'China', DE: 'Germany',
  DK: 'Denmark', EG: 'Egypt', ES: 'Spain', FR: 'France',
  GB: 'United Kingdom', GW: 'Guinea-Bissau', HK: 'Hong Kong', ID: 'Indonesia',
  IE: 'Ireland', IN: 'India', IT: 'Italy', JP: 'Japan', KR: 'South Korea',
  KW: 'Kuwait', LU: 'Luxembourg', MO: 'Macau', MT: 'Malta', MU: 'Mauritius',
  MY: 'Malaysia', NL: 'Netherlands', NZ: 'New Zealand', OM: 'Oman',
  PH: 'Philippines', QA: 'Qatar', SA: 'Saudi Arabia', SE: 'Sweden',
  SG: 'Singapore', TH: 'Thailand', TR: 'Turkey', TW: 'Taiwan', US: 'United States',
  VN: 'Vietnam', ZA: 'South Africa',
};

/** ISO-4217 codes the workbook's currency column uses. */
const CURRENCY_NAMES: Record<string, string> = {
  AED: 'UAE Dirham', AUD: 'Australian Dollar', CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc', CNH: 'Chinese Yuan (Offshore)', CNY: 'Chinese Yuan',
  EUR: 'Euro', GBP: 'Pound Sterling', HKD: 'Hong Kong Dollar',
  INR: 'Indian Rupee', SGD: 'Singapore Dollar', USD: 'US Dollar',
};

/** Multi-currency accounts — a real account shape, not a missing value. */
const MULTI_CURRENCY = { code: 'MUL', name: 'Multi-currency' };
/**
 * Placeholder for rows whose currency cell is blank. bank_accounts.currency_id
 * is NOT NULL, and guessing a currency in a payments system would be worse than
 * flagging it, so these land on an inactive "Unspecified" master row for an
 * operator to correct.
 */
const UNSPECIFIED_CURRENCY = { code: 'UNK', name: 'Unspecified' };

/**
 * Banks whose country no BIC in the workbook reveals. Resolved from the
 * institution's home jurisdiction.
 */
const BANK_COUNTRY_OVERRIDES: Record<string, string> = {
  'ABSA GROUP LIMITED': 'ZA',
  'MACQUARIE BANK LIMITED': 'AU',
  'WESTPAC BANK': 'AU',
  'HDFC BANK LIMITED': 'IN',
  'LLOYDS BANK': 'GB',
  'THE CURRENCY CLOUD LIMITED': 'GB',
  'CITI BANK': 'US',
  'STRATITS - ACCOUNT 1': 'SG',
  'STRATITS - ACCOUNT 2': 'SG',
};

// ---------------------------------------------------------------------------
// Cell / value helpers
// ---------------------------------------------------------------------------

function clean(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).replace(/\s+/g, ' ').trim();
  return s === '' ? undefined : s;
}

/** Trim to a column's length budget so an oversized cell never aborts the run. */
function fit(v: string | undefined, max: number): string | null {
  if (!v) return null;
  return v.length <= max ? v : v.slice(0, max);
}

const STRICT_BIC = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
/** Bank-code position is sometimes a digit in the workbook's messier rows. */
const LOOSE_BIC = /^[A-Z]{4}([A-Z]{2})[A-Z0-9]{2,5}$/;

function normalizeBic(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.replace(/[\s.]/g, '').toUpperCase();
  return STRICT_BIC.test(s) ? s : undefined;
}

function isBic(v: unknown): boolean {
  return normalizeBic(clean(v)) !== undefined;
}

/** ISO country code carried in characters 5-6 of a SWIFT/BIC. */
function countryFromBic(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.replace(/[\s.]/g, '').toUpperCase();
  const m = STRICT_BIC.test(s) ? s.slice(4, 6) : (LOOSE_BIC.exec(s)?.[1] ?? undefined);
  return m && COUNTRY_NAMES[m] ? m : undefined;
}

/**
 * The workbook's columns drift on some rows (a BIC typed into the bank-address
 * or bank-code cell), so fall back to scanning the row's other identifier cells.
 */
function rowCountry(r: SheetRow): string | undefined {
  return (
    countryFromBic(r.swift) ??
    countryFromBic(r.bankAddress) ??
    countryFromBic(r.bankCode) ??
    countryFromBic(r.branchCode) ??
    countryFromBic(r.intermediarySwift)
  );
}

function mostCommon(values: Array<string | undefined>): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | undefined;
  let bestN = 0;
  for (const [v, n] of counts) if (n > bestN) { best = v; bestN = n; }
  return best;
}

/** Words that mark the text after a dash as an institution name, not a place. */
const BANK_WORD = /\b(bank|banque|banco|banking|trust|financial|finance|credit)\b/i;
/** An acronym-like prefix: uppercase letters, digits, dots, parens only. */
const ACRONYM = /^[A-Z0-9][A-Z0-9 ().]{0,9}$/;

/**
 * Split the sheet's "SHORT - Full Bank Name" convention into the bank master's
 * name / short name (e.g. "UBI (UK) - Union Bank of India (UK) Limited").
 *
 * Both halves must look right before splitting: the sheet also uses a dash for
 * branch and account qualifiers ("HSBC - Hong Kong", "Stratits - Account 1"),
 * and splitting those would name a bank after a city and could merge two
 * different institutions that share a branch location.
 */
function splitBankName(raw: string): { name: string; shortName?: string } {
  const m = /^(.{2,20}?)\s*-\s+(.{3,})$/.exec(raw);
  if (!m?.[1] || !m[2]) return { name: raw };
  const prefix = m[1].trim();
  const suffix = m[2].trim();
  if (!ACRONYM.test(prefix) || !BANK_WORD.test(suffix)) return { name: raw };
  return { name: suffix, shortName: prefix };
}

/** Legal-entity code: uppercase alphanumerics/hyphens, unique, <= 30 chars. */
function entityCode(name: string, taken: Set<string>): string {
  const base =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30)
      .replace(/-+$/, '') || 'ENTITY';
  if (!taken.has(base)) { taken.add(base); return base; }
  for (let i = 2; ; i += 1) {
    const suffix = `-${i}`;
    const candidate = base.slice(0, 30 - suffix.length).replace(/-+$/, '') + suffix;
    if (!taken.has(candidate)) { taken.add(candidate); return candidate; }
  }
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * The sheet's own range, re-anchored to A1 so grid indices equal sheet row
 * numbers regardless of where the declared !ref begins.
 */
function absoluteRange(ws: XLSX.WorkSheet): string {
  const declared = ws['!ref'];
  if (!declared) return 'A1:A1';
  const end = XLSX.utils.decode_range(declared).e;
  return XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: end });
}

function readRows(file: string, sheetNames: string[]): SheetRow[] {
  const wb = XLSX.readFile(file, { cellDates: false });
  const out: SheetRow[] = [];
  for (const sheetName of sheetNames) {
    const spec = SHEETS[sheetName];
    if (!spec) {
      console.warn(`  ! unknown sheet "${sheetName}" — skipped`);
      continue;
    }
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn(`  ! sheet "${sheetName}" not found — skipped`);
      continue;
    }
    // firstDataRow is a real sheet row number, so the grid must be absolute:
    // - blankrows must stay on, or blank rows inside the header block shift
    //   every index below it;
    // - the range is forced to start at A1, because a sheet's declared !ref
    //   need not (the "red" sheet declares A3, which would silently drop its
    //   first two data rows).
    const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: false,
      defval: null,
      blankrows: true,
      range: absoluteRange(ws),
    });
    for (let i = spec.firstDataRow - 1; i < grid.length; i += 1) {
      const cells = grid[i] ?? [];
      const row = { _sheet: sheetName } as SheetRow;
      pickLayout(cells, spec.defaultLayout).forEach((key, col) => {
        const v = clean(cells[col]);
        if (v) row[key] = v;
      });
      // A row is data only if it names both an account holder and a bank.
      if (row.accountName && row.bankName) out.push(row);
    }
  }
  return out;
}

/**
 * Several rows identify the account by IBAN only, and a few carry a note
 * ("NO STATEMENTS") where the number belongs. The IBAN column is also where
 * the sheet parks non-IBAN identifiers (French RIBs, Lloyds sort-code/number
 * pairs, bare account numbers), so any digit-bearing value there is a better
 * identifier than a note or a blank.
 */
function accountNumberFor(r: SheetRow): string | undefined {
  const raw = r.accountNumber;
  if (raw && /\d/.test(raw)) return raw;
  const fallback = r.iban && /\d/.test(r.iban)
    ? r.iban.replace(/\s+/g, '').toUpperCase()
    : undefined;
  return fallback ?? raw;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

interface Stats {
  countries: number; currencies: number; legalEntities: number;
  banks: number; accountsCreated: number; accountsUpdated: number;
  skippedNoIdentifier: number; duplicateRows: number;
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const sheetArg = args.find((a) => a.startsWith('--sheets='));
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error(
      'Usage: npm run import:bank-details -- "<path to xlsx>" [--sheets=Companies,red]',
    );
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${path.resolve(file)}`);
    process.exit(1);
  }
  const sheetNames = sheetArg
    ? sheetArg.slice('--sheets='.length).split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SHEETS;

  console.log(`Reading ${path.basename(file)} — sheet(s): ${sheetNames.join(', ')}`);
  const rows = readRows(file, sheetNames);
  console.log(`  ${rows.length} account rows`);

  const ds: DataSource = await dataSource.initialize();
  const stats: Stats = {
    countries: 0, currencies: 0, legalEntities: 0, banks: 0,
    accountsCreated: 0, accountsUpdated: 0, skippedNoIdentifier: 0, duplicateRows: 0,
  };

  try {
    await ds.transaction(async (m) => {
      // --- Countries -------------------------------------------------------
      const bankRows = new Map<string, SheetRow[]>();
      for (const r of rows) {
        const key = r.bankName!;
        (bankRows.get(key) ?? bankRows.set(key, []).get(key)!).push(r);
      }

      const bankCountry = new Map<string, string>();
      for (const [bankName, rs] of bankRows) {
        const code =
          mostCommon(rs.map(rowCountry)) ??
          BANK_COUNTRY_OVERRIDES[bankName.toUpperCase()];
        if (code) bankCountry.set(bankName, code);
      }
      const unresolvedBanks = [...bankRows.keys()].filter((b) => !bankCountry.has(b));

      const countryCodes = new Set(bankCountry.values());
      const countries = new Map<string, Country>();
      for (const code of [...countryCodes].sort()) {
        const name = COUNTRY_NAMES[code] ?? code;
        let c = await m.findOne(Country, { where: { code } });
        if (!c) {
          c = m.create(Country, {
            code,
            countryName: name,
            countryShortName: code,
            isActive: true,
            isSanctioned: false,
          });
          await m.save(c);
          stats.countries += 1;
        }
        countries.set(code, c);
      }

      // --- Currencies ------------------------------------------------------
      const currencyCodes = new Set<string>();
      for (const r of rows) {
        const raw = r.currency?.toUpperCase();
        if (raw && CURRENCY_NAMES[raw]) currencyCodes.add(raw);
      }
      const currencies = new Map<string, Currency>();
      const upsertCurrency = async (code: string, name: string, isActive: boolean) => {
        let c = await m.findOne(Currency, { where: { code } });
        if (!c) {
          c = m.create(Currency, { code, name, isActive });
          await m.save(c);
          stats.currencies += 1;
        }
        currencies.set(code, c);
        return c;
      };
      for (const code of [...currencyCodes].sort()) {
        await upsertCurrency(code, CURRENCY_NAMES[code]!, true);
      }

      // The two placeholder currencies are only created when the imported rows
      // actually need them, so a clean sheet leaves no unused master rows.
      const rowCurrency = (r: SheetRow) => r.currency?.toUpperCase();
      const needsMulti = rows.some((r) => rowCurrency(r) === 'MULTI');
      const needsUnspecified = rows.some((r) => {
        const v = rowCurrency(r);
        return v !== 'MULTI' && !(v && currencies.has(v));
      });
      const multiCurrency = needsMulti
        ? await upsertCurrency(MULTI_CURRENCY.code, MULTI_CURRENCY.name, true)
        : undefined;
      const unspecifiedCurrency = needsUnspecified
        ? await upsertCurrency(UNSPECIFIED_CURRENCY.code, UNSPECIFIED_CURRENCY.name, false)
        : undefined;

      const resolveCurrency = (raw?: string): Currency => {
        const v = raw?.toUpperCase();
        if (v && currencies.has(v)) return currencies.get(v)!;
        if (v === 'MULTI') return multiCurrency!;
        // blank, or "FD" (an account type, not a currency)
        return unspecifiedCurrency!;
      };

      // --- Account types ---------------------------------------------------
      // The workbook records no account type. Imported accounts are Collateral
      // accounts by business rule, except where the currency cell reads "FD"
      // (fixed deposit), which the sheet does state.
      let collateral = await m.findOne(AccountType, { where: { name: 'Collateral' } });
      if (!collateral) {
        collateral = m.create(AccountType, { name: 'Collateral', isActive: true });
        await m.save(collateral);
      }
      let fixedDeposit: AccountType | null = null;
      if (rows.some((r) => r.currency?.toUpperCase() === 'FD')) {
        fixedDeposit = await m.findOne(AccountType, { where: { name: 'Fixed Deposit' } });
        if (!fixedDeposit) {
          fixedDeposit = m.create(AccountType, { name: 'Fixed Deposit', isActive: true });
          await m.save(fixedDeposit);
        }
      }

      // --- Legal entities (Account Name) -----------------------------------
      const entityRows = new Map<string, SheetRow[]>();
      for (const r of rows) {
        const key = r.accountName!;
        (entityRows.get(key) ?? entityRows.set(key, []).get(key)!).push(r);
      }
      const takenCodes = new Set(
        (await m.find(LegalEntity, { select: ['code'] })).map((e) => e.code),
      );
      const legalEntities = new Map<string, LegalEntity>();
      for (const [name, rs] of entityRows) {
        let le = await m.findOne(LegalEntity, { where: { name } });
        // No country column exists for the account holder; the country its
        // accounts are held in is the only signal the workbook carries.
        const countryCode = mostCommon(rs.map((r) => bankCountry.get(r.bankName!)));
        if (!le) {
          le = m.create(LegalEntity, {
            name: fit(name, 200)!,
            code: entityCode(name, takenCodes),
            countryId: countryCode ? countries.get(countryCode)!.id : null,
            isActive: true,
          });
          await m.save(le);
          stats.legalEntities += 1;
        } else if (!le.countryId && countryCode) {
          le.countryId = countries.get(countryCode)!.id;
          await m.save(le);
        }
        legalEntities.set(name, le);
      }

      // --- Banks -----------------------------------------------------------
      const banks = new Map<string, Bank>();
      for (const [rawName, rs] of bankRows) {
        const countryCode = bankCountry.get(rawName);
        if (!countryCode) continue; // reported below; its accounts are skipped
        const country = countries.get(countryCode)!;
        const { name, shortName } = splitBankName(rawName);
        const swift = mostCommon(rs.map((r) => normalizeBic(r.swift)));

        let bank = await m.findOne(Bank, {
          where: { name: fit(name, 200)!, countryId: country.id, isCounterparty: false },
        });
        if (!bank) {
          bank = m.create(Bank, {
            name: fit(name, 200)!,
            shortName: fit(shortName, 50),
            countryId: country.id,
            swiftBic: fit(swift, 20),
            isActive: true,
            isCounterparty: false,
          });
          await m.save(bank);
          stats.banks += 1;
        } else if (!bank.swiftBic && swift) {
          bank.swiftBic = fit(swift, 20);
          await m.save(bank);
        }
        banks.set(rawName, bank);
      }

      // --- Bank accounts ---------------------------------------------------
      const seen = new Set<string>();
      const skipped: string[] = [];
      for (const r of rows) {
        const bank = banks.get(r.bankName!);
        const accountNumber = accountNumberFor(r);
        if (!bank || !accountNumber) {
          // account_number is NOT NULL and the sheet gives nothing to key on;
          // inventing a number would be worse than reporting the gap.
          stats.skippedNoIdentifier += 1;
          skipped.push(`${r.accountName} | ${r.bankName} | ${r.currency ?? '(no currency)'} [${r._sheet}]`);
          continue;
        }
        const currency = resolveCurrency(r.currency);

        // The workbook repeats some accounts across sheets; identity is
        // (bank, number, currency), matching the DB's uniqueness rule.
        const key = `${bank.id}|${accountNumber.toUpperCase()}|${currency.id}`;
        if (seen.has(key)) { stats.duplicateRows += 1; continue; }
        seen.add(key);

        const legalEntity = legalEntities.get(r.accountName!)!;
        const fields = {
          bankId: bank.id,
          bankName: fit(r.bankName, 150),
          legalEntityId: legalEntity.id,
          bankNickname: fit(legalEntity.name, 100),
          currencyId: currency.id,
          accountTypeId:
            r.currency?.toUpperCase() === 'FD' && fixedDeposit
              ? fixedDeposit.id
              : collateral.id,
          accountNumber: fit(accountNumber, 50)!,
          accountHolderName: fit(r.accountName, 200),
          swiftBic: fit(normalizeBic(r.swift) ?? r.swift, 20),
          iban: fit(r.iban, 60),
          abaNumber: fit(r.aba, 40),
          bankCode: fit(r.bankCode, 50),
          sortCode: fit(r.sortCode, 150),
          customerId: fit(r.customerId, 60),
          branchCode: fit(r.branchCode, 50),
          bankAddress: r.bankAddress ?? null,
          correspondentBank: r.intermediaryBank ?? null,
          correspondentSwift: fit(r.intermediarySwift, 100),
          contactName: fit(r.rm, 150),
          contactPhone: fit(r.rmTel, 60),
          contactPhoneAlt: fit(r.rmMobile, 60),
          contactEmail: fit(r.rmEmail, 150),
          fax: fit(r.fax, 80),
          authSignatory: fit(r.authSignatory, 200),
          registeredEmail: fit(r.registeredEmail, 150),
          isCounterparty: false,
          isActive: true,
        };

        const existing = await m.findOne(BankAccount, {
          where: {
            bankId: bank.id,
            accountNumber: fields.accountNumber,
            currencyId: currency.id,
            isCounterparty: false,
          },
        });
        if (existing) {
          Object.assign(existing, fields);
          await m.save(existing);
          stats.accountsUpdated += 1;
        } else {
          await m.save(m.create(BankAccount, fields));
          stats.accountsCreated += 1;
        }
      }

      if (skipped.length > 0) {
        console.warn(
          `\n  ! ${skipped.length} row(s) carried no account number or IBAN and were skipped:`,
        );
        for (const s of skipped) console.warn(`      ${s}`);
      }

      if (unresolvedBanks.length > 0) {
        console.warn(
          `\n  ! ${unresolvedBanks.length} bank(s) had no derivable country; their accounts were skipped:`,
        );
        for (const b of unresolvedBanks) console.warn(`      ${b}`);
      }
    });

    console.log('\nImport complete:');
    console.log(`  countries created      ${stats.countries}`);
    console.log(`  currencies created     ${stats.currencies}`);
    console.log(`  legal entities created ${stats.legalEntities}`);
    console.log(`  banks created          ${stats.banks}`);
    console.log(`  bank accounts created  ${stats.accountsCreated}`);
    console.log(`  bank accounts updated  ${stats.accountsUpdated}`);
    console.log(`  duplicate rows merged  ${stats.duplicateRows}`);
    console.log(`  rows skipped           ${stats.skippedNoIdentifier}`);
  } finally {
    await ds.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
