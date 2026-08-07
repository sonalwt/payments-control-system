import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';

import { Currency } from '../currencies/currency.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { BeneficiaryAccount } from '../beneficiary-accounts/beneficiary-account.entity';
import { InvoiceWebhookDto, SupplierBankAccountDto } from './dto/invoice-webhook.dto';

/** A name the upstream system sent that PCS could not resolve to exactly one record. */
export interface ResolutionIssue {
  field: string;
  value: string;
  message: string;
  /** Near matches, so the integrator can see what PCS actually holds. */
  candidates?: string[];
  /**
   * True only when NOTHING in the master resembles the name — no exact match,
   * no loose match, and no near miss to show. Callers may then provision the
   * record. A near miss deliberately clears this: a lookalike of an approved
   * vendor is exactly the case a human must adjudicate, not one to auto-create.
   */
  autoCreatable?: boolean;
}

export interface ResolvedInvoiceTargets {
  currencyId: string;
  counterpartyId: string | null;
  legalEntityId: string | null;
  beneficiaryAccountId: string | null;
  /** Human-readable echo of what each name matched, returned to the caller. */
  matched: Record<string, string | null>;
  /** Non-blocking notes (e.g. no beneficiary on file yet). */
  warnings: string[];
}

/** Trim, lowercase, collapse internal whitespace. */
function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Bank identifiers are printed with arbitrary spacing; compare them without it. */
function stripSpaces(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}

/**
 * Normalisation for near-matching: drops punctuation and the corporate-form
 * suffixes that invoicing systems and payment masters routinely disagree on,
 * so "Acme Trading L.L.C." and "Acme Trading" compare equal.
 */
const LEGAL_SUFFIXES =
  /\b(llc|ltd|limited|inc|incorporated|corp|corporation|co|company|fze|fzco|fzc|fz|dmcc|llp|lp|plc|pvt|private|gmbh|sarl|sa|bv|nv|pte|est|establishment)\b/g;

function loose(value: string): string {
  return norm(value)
    // Includes en/em dashes and typographic quotes — upstream systems and the
    // PCS masters routinely disagree on which dash a name uses.
    .replace(/[.,'"`()\[\]&/\\‐-―‘’“”-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(LEGAL_SUFFIXES, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type MatchOutcome<T> =
  | { kind: 'MATCH'; row: T }
  | { kind: 'NONE'; candidates: T[] }
  | { kind: 'AMBIGUOUS'; candidates: T[] };

/**
 * Resolves the *names* an upstream invoicing system sends into PCS master
 * record ids. Nothing is created here and nothing is guessed: a name either
 * matches exactly one active record or it is reported back as an issue.
 *
 * Matching runs in two passes — an exact (case/whitespace-insensitive) compare
 * first, then a "loose" compare that ignores punctuation and corporate-form
 * suffixes. A loose pass that hits more than one record is ambiguous, not a
 * match, because picking a payee by coin-flip is how money goes to the wrong
 * account.
 */
@Injectable()
export class InvoiceNameResolver {
  constructor(
    @InjectRepository(Currency)
    private readonly currencies: Repository<Currency>,
    @InjectRepository(Counterparty)
    private readonly counterparties: Repository<Counterparty>,
    @InjectRepository(LegalEntity)
    private readonly legalEntities: Repository<LegalEntity>,
    @InjectRepository(BeneficiaryAccount)
    private readonly beneficiaries: Repository<BeneficiaryAccount>,
  ) {}

  async resolve(
    dto: InvoiceWebhookDto,
  ): Promise<{ resolved?: ResolvedInvoiceTargets; issues: ResolutionIssue[] }> {
    const issues: ResolutionIssue[] = [];
    const warnings: string[] = [];
    const matched: Record<string, string | null> = {};

    const currency = await this.resolveCurrency(dto.currency, issues);

    const counterparty = await this.resolveCounterparty(dto.counterpartyName, issues);
    if (counterparty && counterparty.kycStatus !== 'APPROVED') {
      warnings.push(
        `Counterparty "${counterparty.name}" has KYC status ${counterparty.kycStatus}; ` +
          'the request cannot be submitted for approval until KYC is approved.',
      );
    }

    const legalEntity = await this.resolveLegalEntity(dto.legalEntityName, issues);

    matched.currency = currency ? (currency.code ?? currency.name) : null;
    matched.counterparty = counterparty ? `${counterparty.name} (${counterparty.code})` : null;
    matched.legalEntity = legalEntity ? `${legalEntity.name} (${legalEntity.code})` : null;
    matched.beneficiary = null;

    // The beneficiary is only resolvable once the payee and currency are known.
    let beneficiary: BeneficiaryAccount | null = null;
    if (currency && counterparty) {
      beneficiary = await this.resolveSupplierAccount(
        dto.supplierBankAccount,
        currency.id,
        counterparty,
        warnings,
      );
      if (beneficiary) {
        matched.beneficiary = `${beneficiary.accountHolderName} — ${this.maskAccount(beneficiary)}`;
      }
    }

    if (issues.length > 0 || !currency) {
      return { issues };
    }

    return {
      issues,
      resolved: {
        currencyId: currency.id,
        counterpartyId: counterparty?.id ?? null,
        legalEntityId: legalEntity?.id ?? null,
        beneficiaryAccountId: beneficiary?.id ?? null,
        matched,
        warnings,
      },
    };
  }

  // ── Per-master resolution ────────────────────────────────────────────

  private async resolveCurrency(
    name: string,
    issues: ResolutionIssue[],
  ): Promise<Currency | null> {
    const rows = await this.candidates(
      this.currencies,
      'c',
      ['c.name', 'c.code'],
      name,
      (qb) => qb.andWhere('c.isActive = true'),
    );
    return this.pick(
      'currency',
      name,
      rows,
      (r) => [r.code, r.name],
      issues,
      (r) => r.code ?? r.name,
    );
  }

  /**
   * Counterparties are matched EXACTLY — on name, legal name or code, ignoring
   * only case and surrounding/repeated whitespace. No loose pass here, unlike
   * the other masters: an unmatched supplier is provisioned rather than
   * rejected, and a fuzzy match would decide, silently, whether an invoice
   * joins an existing supplier or creates a new one. Exact is predictable and
   * the sender controls it.
   */
  private async resolveCounterparty(
    name: string,
    issues: ResolutionIssue[],
  ): Promise<Counterparty | null> {
    const rows = await this.counterparties
      .createQueryBuilder('cp')
      .where('cp.isActive = true')
      .andWhere(
        `(LOWER(TRIM(cp.name)) = :exact
          OR LOWER(TRIM(cp.legalName)) = :exact
          OR LOWER(TRIM(cp.code)) = :exact)`,
        { exact: norm(name) },
      )
      .take(5)
      .getMany();

    if (rows.length === 1) return rows[0];

    if (rows.length > 1) {
      issues.push({
        field: 'counterpartyName',
        value: name,
        message: `"${name}" matches more than one counterparty in PCS. Send the registered code instead.`,
        candidates: rows.map((r) => r.name),
      });
      return null;
    }

    issues.push({
      field: 'counterpartyName',
      value: name,
      message: `"${name}" does not match any active counterparty in PCS.`,
      autoCreatable: true,
    });
    return null;
  }

  private async resolveLegalEntity(
    name: string,
    issues: ResolutionIssue[],
  ): Promise<LegalEntity | null> {
    const rows = await this.candidates(
      this.legalEntities,
      'le',
      ['le.name', 'le.code'],
      name,
      (qb) => qb.andWhere('le.isActive = true'),
    );
    return this.pick('legalEntityName', name, rows, (r) => [r.name, r.code], issues, (r) => r.name);
  }

  /**
   * Matches the bank account printed on the invoice against the vendor's
   * accounts on the beneficiary master.
   *
   * The account number or IBAN is the only trustworthy key here — a name match
   * is not enough to decide where money goes, so a supplier account that PCS
   * does not already hold is never linked and never created (that would bypass
   * KYC and the cooling-off window). This never blocks the webhook: an
   * unmatched account leaves the draft without a beneficiary and warns, and the
   * supplied details are carried onto the draft for the maker.
   */
  private async resolveSupplierAccount(
    supplied: SupplierBankAccountDto,
    currencyId: string,
    counterparty: Counterparty,
    warnings: string[],
  ): Promise<BeneficiaryAccount | null> {
    const rows = await this.beneficiaries
      .createQueryBuilder('b')
      .where('b.currencyId = :currencyId', { currencyId })
      .andWhere("b.accountDirection IN ('PAY_TO', 'BOTH')")
      .andWhere("b.status = 'ACTIVE'")
      .andWhere('b.counterpartyId = :owner', { owner: counterparty.id })
      .getMany();

    const payee = counterparty.name;
    if (rows.length === 0) {
      warnings.push(
        `No active beneficiary account on file for ${payee} in ${supplied.accountName ? 'this currency' : 'this currency'}. ` +
          'The draft has no beneficiary — add the account to the master, then select it before submitting.',
      );
      return null;
    }

    const keys = [supplied.accountNumber, supplied.iban]
      .filter((v): v is string => !!v)
      .map(stripSpaces);
    const matches = rows.filter((r) =>
      keys.includes(stripSpaces(r.accountNumber)) ||
      (r.iban ? keys.includes(stripSpaces(r.iban)) : false),
    );

    if (matches.length === 1) {
      const only = matches[0];
      if (only.coolingOffUntil && only.coolingOffUntil.getTime() > Date.now()) {
        warnings.push(
          `Beneficiary account "${only.accountHolderName}" is still within its cooling-off ` +
            'period and cannot be paid until it elapses.',
        );
      }
      return only;
    }

    if (matches.length > 1) {
      warnings.push(
        `The bank account on the invoice matches ${matches.length} accounts held for ${payee}. ` +
          'The draft has no beneficiary — select the correct one before submitting.',
      );
      return null;
    }

    warnings.push(
      `The bank account on the invoice is not on file for ${payee}. The draft has no ` +
        'beneficiary — verify the details against the master and add the account through the ' +
        'beneficiary change process before submitting.',
    );
    return null;
  }

  // ── Matching machinery ───────────────────────────────────────────────

  /**
   * Pulls the plausible rows for a name: an exact compare on any of the given
   * columns, OR a keyword search on the most distinctive words in the term.
   *
   * The keyword search deliberately matches raw words rather than the loose
   * form of the whole string — the loose form drops punctuation and suffixes
   * that are still present in the stored column, so comparing it against the
   * raw column would match nothing. Narrowing is the JS loose compare's job;
   * this only has to surface the row.
   */
  private async candidates<T extends ObjectLiteral>(
    repo: Repository<T>,
    alias: string,
    columns: string[],
    term: string,
    scope: (qb: ReturnType<Repository<T>['createQueryBuilder']>) => unknown,
  ): Promise<T[]> {
    const exactParam = norm(term);
    const qb = repo.createQueryBuilder(alias);
    scope(qb);

    const exactClause = columns.map((c) => `LOWER(TRIM(${c})) = :exact`).join(' OR ');
    const params: Record<string, unknown> = { exact: exactParam };

    // Up to two of the longest distinctive words, ANDed — enough to cut a big
    // master down to a handful of rows without over-narrowing.
    const keywords = loose(term)
      .split(' ')
      .filter((w) => w.length >= 3)
      .sort((a, b) => b.length - a.length)
      .slice(0, 2);
    if (keywords.length === 0) {
      const fallback = exactParam.split(' ')[0];
      if (fallback) keywords.push(fallback);
    }

    const keywordClauses = keywords.map((word, i) => {
      params[`kw${i}`] = `%${word}%`;
      return `(${columns.map((c) => `${c} ILIKE :kw${i}`).join(' OR ')})`;
    });

    const clause = keywordClauses.length
      ? `((${exactClause}) OR (${keywordClauses.join(' AND ')}))`
      : `(${exactClause})`;
    qb.andWhere(clause, params);
    return qb.take(25).getMany();
  }

  /** Exact pass, then loose pass; anything else is an issue, never a guess. */
  private pick<T>(
    field: string,
    term: string,
    rows: T[],
    namesOf: (row: T) => (string | null | undefined)[],
    issues: ResolutionIssue[],
    label: (row: T) => string,
  ): T | null {
    const outcome = this.match(term, rows, namesOf);
    if (outcome.kind === 'MATCH') return outcome.row;

    if (outcome.kind === 'AMBIGUOUS') {
      issues.push({
        field,
        value: term,
        message: `"${term}" matches more than one record in PCS. Send the exact registered name or code.`,
        candidates: outcome.candidates.map(label),
      });
      return null;
    }

    issues.push({
      field,
      value: term,
      message: `"${term}" does not match any active record in PCS.`,
      candidates: outcome.candidates.length > 0 ? outcome.candidates.map(label) : undefined,
      autoCreatable: outcome.candidates.length === 0,
    });
    return null;
  }

  private match<T>(
    term: string,
    rows: T[],
    namesOf: (row: T) => (string | null | undefined)[],
  ): MatchOutcome<T> {
    const exactTarget = norm(term);
    const exact = rows.filter((r) => namesOf(r).some((n) => n != null && norm(n) === exactTarget));
    if (exact.length === 1) return { kind: 'MATCH', row: exact[0] };
    if (exact.length > 1) return { kind: 'AMBIGUOUS', candidates: exact };

    const looseTarget = loose(term);
    const near = looseTarget
      ? rows.filter((r) => namesOf(r).some((n) => n != null && loose(n) === looseTarget))
      : [];
    if (near.length === 1) return { kind: 'MATCH', row: near[0] };
    if (near.length > 1) return { kind: 'AMBIGUOUS', candidates: near };

    // Nothing matched — return whatever the contains-search surfaced as hints.
    return { kind: 'NONE', candidates: rows.slice(0, 5) };
  }

  private maskAccount(b: BeneficiaryAccount): string {
    const value = b.iban ?? b.accountNumber;
    return value.length <= 4 ? value : `****${value.slice(-4)}`;
  }
}
