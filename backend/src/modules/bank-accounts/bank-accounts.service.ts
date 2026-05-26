import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike, IsNull } from 'typeorm';
import {
  BalanceSource,
  BankAccount,
  BankAccountType,
} from './bank-account.entity';
import { BalanceChange, BalanceChangeKind } from './balance-change.entity';
import { BankAccountsRepository } from './bank-accounts.repository';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BalanceOverrideDto } from './dto/balance-override.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface BankAccountQuery extends PaginationQueryDto {
  legalEntityId?: string;
  bankId?: string;
  currencyId?: string;
  accountType?: BankAccountType;
  isActive?: 'true' | 'false';
  isChairmanDesignated?: 'true' | 'false';
}

interface BalanceMovementInput {
  accountId: string;
  amount: string; // positive magnitude, in account currency
  reason?: string;
  paymentRequestId?: string | null;
  receiptId?: string | null;
  userId?: string | null;
}

@Injectable()
export class BankAccountsService {
  constructor(private readonly repo: BankAccountsRepository) {}

  // -------------------------------------------------------------------
  // CRUD (§2.4)
  // -------------------------------------------------------------------

  async create(
    dto: CreateBankAccountDto,
    userId: string,
  ): Promise<BankAccount> {
    if (dto.accountType !== 'CURRENT' && dto.minimumBalance) {
      throw new BadRequestException(
        'minimumBalance is only applicable to CURRENT accounts.',
      );
    }
    if (dto.accountType === 'CURRENT' && !dto.minimumBalance) {
      throw new BadRequestException(
        'CURRENT accounts must specify minimumBalance.',
      );
    }

    const dup = await this.repo.findByLookup({
      bankId: dto.bankId,
      accountNumber: dto.accountNumber,
      deletedAt: IsNull(),
    });
    if (dup) {
      throw new ConflictException(
        `Account "${dto.accountNumber}" already exists at this bank.`,
      );
    }

    const opening = dto.openingBalance ?? '0';
    const entity = this.repo.create({
      nickname: dto.nickname,
      legalEntityId: dto.legalEntityId,
      bankId: dto.bankId,
      currencyId: dto.currencyId,
      accountNumber: dto.accountNumber,
      iban: dto.iban ?? null,
      accountType: dto.accountType,
      branchName: dto.branchName ?? null,
      branchCode: dto.branchCode ?? null,
      balance: opening,
      balanceAsOf: new Date(),
      balanceSource: 'SEEDED',
      minimumBalance: dto.accountType === 'CURRENT' ? (dto.minimumBalance ?? '0') : null,
      isChairmanDesignated: dto.isChairmanDesignated ?? false,
      isActive: dto.isActive ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.repo.save(entity);

    // Seed the change log with the opening balance so the dashboard
    // can always render a non-empty movement history.
    await this.repo.recordChange({
      accountId: saved.id,
      kind: 'MANUAL_OVERRIDE',
      previousBalance: '0.0000',
      newBalance: opening,
      delta: opening,
      reason: 'Seeded opening balance at account creation.',
      changedBy: userId,
    });
    return saved;
  }

  async findAll(
    query: BankAccountQuery,
  ): Promise<PaginatedResult<BankAccount>> {
    const {
      page = 1,
      limit = 20,
      search,
      legalEntityId,
      bankId,
      currencyId,
      accountType,
      isActive,
      isChairmanDesignated,
    } = query;

    const where: Record<string, unknown> = {};
    if (legalEntityId) where.legalEntityId = legalEntityId;
    if (bankId) where.bankId = bankId;
    if (currencyId) where.currencyId = currencyId;
    if (accountType) where.accountType = accountType;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (isChairmanDesignated === 'true') where.isChairmanDesignated = true;
    if (isChairmanDesignated === 'false') where.isChairmanDesignated = false;

    const baseWhere = search
      ? [
          { ...where, nickname: ILike(`%${search}%`) },
          { ...where, accountNumber: ILike(`%${search}%`) },
          { ...where, iban: ILike(`%${search}%`) },
        ]
      : Object.keys(where).length > 0
        ? where
        : undefined;

    const [data, total] = await this.repo.accountsRaw.findAndCount({
      where: baseWhere,
      relations: { bank: true, currency: true, legalEntity: true },
      order: { nickname: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findOne(id: string): Promise<BankAccount> {
    return this.requireById(id);
  }

  async update(
    id: string,
    dto: UpdateBankAccountDto,
    userId: string,
  ): Promise<BankAccount> {
    const acct = await this.requireById(id);
    if (acct.accountType !== 'CURRENT' && dto.minimumBalance) {
      throw new BadRequestException(
        'minimumBalance is only applicable to CURRENT accounts.',
      );
    }
    Object.assign(acct, dto, { updatedBy: userId });
    return this.repo.save(acct);
  }

  async remove(id: string, userId: string): Promise<void> {
    const acct = await this.requireById(id);
    acct.updatedBy = userId;
    await this.repo.save(acct);
    await this.repo.softRemove(acct);
  }

  /** Selectable source accounts for the maker (§2.5). */
  selectableSources(args: {
    legalEntityId: string;
    currencyId?: string;
    includeChairman?: boolean;
  }): Promise<BankAccount[]> {
    return this.repo.findSelectableSourceAccounts({
      legalEntityId: args.legalEntityId,
      currencyId: args.currencyId,
      accountType: 'CURRENT',
      includeChairman: args.includeChairman,
    });
  }

  /** Recent balance movements for an account (audit view). */
  history(accountId: string, limit = 50): Promise<BalanceChange[]> {
    return this.repo.listChanges(accountId, limit);
  }

  // -------------------------------------------------------------------
  // §2.5 — Balance Maintenance & Minimum-Balance Control
  // -------------------------------------------------------------------

  /**
   * Hard guard for the maker UI: throws if the requested debit would
   * push the account below its minimum balance. The check is evaluated
   * in the account's own currency; the cross-currency variant supplies
   * an indicative equivalent (§2.6) computed upstream and passes it
   * here as `amount`.
   */
  async assertMinimumBalance(
    accountId: string,
    debitAmount: string,
  ): Promise<{ ok: true } | never> {
    const acct = await this.requireById(accountId);
    if (acct.accountType !== 'CURRENT') {
      throw new BadRequestException(
        `Account ${acct.nickname} is not a CURRENT account and cannot fund a TT.`,
      );
    }
    const proposedBalance =
      this.toNumber(acct.balance) - this.toNumber(debitAmount);
    const min = this.toNumber(acct.minimumBalance ?? '0');
    if (proposedBalance < min) {
      throw new BadRequestException(
        `Release blocked: post-payment balance ${proposedBalance.toFixed(
          4,
        )} would fall below the minimum balance ${min.toFixed(4)} for ` +
          `account "${acct.nickname}".`,
      );
    }
    return { ok: true };
  }

  /** §2.5 — debit on Paid. Used by the payment lifecycle module. */
  debitForPayment(input: BalanceMovementInput): Promise<BankAccount> {
    return this.applyMovement('PAYMENT_DEBIT', input, /* sign */ -1, 'SYSTEM_COMPUTED');
  }

  /** §2.5 — credit on Received. */
  creditForReceipt(input: BalanceMovementInput): Promise<BankAccount> {
    return this.applyMovement('RECEIPT_CREDIT', input, /* sign */ +1, 'SYSTEM_COMPUTED');
  }

  /**
   * §2.6 — Post-execution amount correction for a cross-currency payment.
   *
   * `previouslyDebited` is the indicative amount that was applied when
   * the request moved to Paid; `correctedAmount` is the actual figure
   * from the proof of payment. We compute the delta and apply it, so
   * (e.g.) a correction from 1,000 -> 1,025 results in an additional
   * 25-unit debit. Callers are responsible for the §2.6 lock: once the
   * debit has been matched against a bank statement the amount is
   * frozen and this method should not be called.
   */
  async correctCrossCurrencyDebit(args: {
    accountId: string;
    previouslyDebited: string;
    correctedAmount: string;
    reason: string;
    userId: string;
    paymentRequestId?: string | null;
  }): Promise<BankAccount> {
    const delta =
      this.toNumber(args.previouslyDebited) - this.toNumber(args.correctedAmount);
    // delta > 0 -> over-debited, credit it back; delta < 0 -> under-debited.
    if (delta === 0) {
      throw new BadRequestException(
        'Corrected amount equals previously debited amount; nothing to adjust.',
      );
    }
    const acct = await this.requireById(args.accountId);
    const prev = this.toNumber(acct.balance);
    const next = prev + delta; // positive delta credits the account.
    return this.commitBalance(acct, prev, next, {
      kind: 'PAYMENT_CORRECTION',
      reason: args.reason,
      paymentRequestId: args.paymentRequestId ?? null,
      changedBy: args.userId,
      source: 'SYSTEM_COMPUTED',
    });
  }

  /** §2.5 — manual override between reconciliations. */
  async manualOverride(
    accountId: string,
    dto: BalanceOverrideDto,
    userId: string,
  ): Promise<BankAccount> {
    const acct = await this.requireById(accountId);
    const prev = this.toNumber(acct.balance);
    const next = this.toNumber(dto.newBalance);
    return this.commitBalance(acct, prev, next, {
      kind: 'MANUAL_OVERRIDE',
      reason: dto.reason,
      changedBy: userId,
      source: 'MANUAL_OVERRIDE',
    });
  }

  /**
   * §2.5 — On weekly bank-statement upload the recorded balance is reset
   * to the statement's closing balance. The reset is logged as a
   * reconciliation adjustment in the audit trail.
   */
  async resetFromStatement(args: {
    accountId: string;
    closingBalance: string;
    statementUploadId: string;
    asOfDate?: Date;
    userId?: string | null;
  }): Promise<BankAccount> {
    const acct = await this.requireById(args.accountId);
    const prev = this.toNumber(acct.balance);
    const next = this.toNumber(args.closingBalance);
    return this.commitBalance(acct, prev, next, {
      kind: 'STATEMENT_RESET',
      reason: `Weekly bank-statement reconciliation reset to closing balance.`,
      statementUploadId: args.statementUploadId,
      changedBy: args.userId ?? null,
      source: 'STATEMENT_RECONCILED',
      asOfDate: args.asOfDate,
    });
  }

  // -------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------

  private async applyMovement(
    kind: BalanceChangeKind,
    input: BalanceMovementInput,
    sign: 1 | -1,
    source: BalanceSource,
  ): Promise<BankAccount> {
    const acct = await this.requireById(input.accountId);
    const magnitude = this.toNumber(input.amount);
    if (magnitude <= 0) {
      throw new BadRequestException(
        'Movement amount must be a positive magnitude.',
      );
    }
    const prev = this.toNumber(acct.balance);
    const next = prev + sign * magnitude;
    return this.commitBalance(acct, prev, next, {
      kind,
      reason: input.reason ?? null,
      paymentRequestId: input.paymentRequestId ?? null,
      receiptId: input.receiptId ?? null,
      changedBy: input.userId ?? null,
      source,
    });
  }

  private async commitBalance(
    acct: BankAccount,
    previous: number,
    next: number,
    meta: {
      kind: BalanceChangeKind;
      reason?: string | null;
      paymentRequestId?: string | null;
      receiptId?: string | null;
      statementUploadId?: string | null;
      changedBy?: string | null;
      source: BalanceSource;
      asOfDate?: Date;
    },
  ): Promise<BankAccount> {
    acct.balance = next.toFixed(4);
    acct.balanceAsOf = meta.asOfDate ?? new Date();
    acct.balanceSource = meta.source;
    await this.repo.save(acct);

    await this.repo.recordChange({
      accountId: acct.id,
      kind: meta.kind,
      previousBalance: previous.toFixed(4),
      newBalance: next.toFixed(4),
      delta: (next - previous).toFixed(4),
      reason: meta.reason ?? null,
      paymentRequestId: meta.paymentRequestId ?? null,
      receiptId: meta.receiptId ?? null,
      statementUploadId: meta.statementUploadId ?? null,
      changedBy: meta.changedBy ?? null,
    });
    return acct;
  }

  private async requireById(id: string): Promise<BankAccount> {
    const acct = await this.repo.findOneById(id);
    if (!acct) throw new NotFoundException(`Bank account ${id} not found`);
    return acct;
  }

  /** Parse a DECIMAL string into a finite number. */
  private toNumber(v: string | null | undefined): number {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(v);
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`Invalid numeric value: ${v}`);
    }
    return n;
  }
}
