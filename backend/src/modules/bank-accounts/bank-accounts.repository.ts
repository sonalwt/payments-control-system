import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BankAccount, BankAccountType } from './bank-account.entity';
import { BalanceChange } from './balance-change.entity';

@Injectable()
export class BankAccountsRepository {
  constructor(
    @InjectRepository(BankAccount)
    private readonly accounts: Repository<BankAccount>,
    @InjectRepository(BalanceChange)
    private readonly changes: Repository<BalanceChange>,
  ) {}

  get accountsRaw(): Repository<BankAccount> {
    return this.accounts;
  }

  get changesRaw(): Repository<BalanceChange> {
    return this.changes;
  }

  create(data: Partial<BankAccount>): BankAccount {
    return this.accounts.create(data);
  }

  save(entity: BankAccount): Promise<BankAccount> {
    return this.accounts.save(entity);
  }

  findOneById(id: string): Promise<BankAccount | null> {
    return this.accounts.findOne({
      where: { id },
      relations: { bank: true, currency: true, legalEntity: true },
    });
  }

  findByLookup(
    where: FindOptionsWhere<BankAccount>,
  ): Promise<BankAccount | null> {
    return this.accounts.findOne({ where });
  }

  /**
   * Selectable source accounts for an outgoing TT (§2.5).
   *
   * Filters to CURRENT accounts of the supplied legal entity. When a
   * currency is supplied we restrict to accounts in that currency
   * (single-currency case); when not, we return all currencies so the
   * caller can offer cross-currency options (§2.6).
   *
   * Excludes inactive, chairman-designated, and soft-deleted rows.
   */
  findSelectableSourceAccounts(args: {
    legalEntityId: string;
    currencyId?: string;
    accountType?: BankAccountType;
    includeChairman?: boolean;
  }): Promise<BankAccount[]> {
    const where: FindOptionsWhere<BankAccount> = {
      legalEntityId: args.legalEntityId,
      accountType: args.accountType ?? 'CURRENT',
      isActive: true,
    };
    if (args.currencyId) {
      where.currencyId = args.currencyId;
    }
    if (!args.includeChairman) {
      where.isChairmanDesignated = false;
    }
    return this.accounts.find({
      where,
      relations: { bank: true, currency: true },
      order: { nickname: 'ASC' },
    });
  }

  softRemove(entity: BankAccount): Promise<BankAccount> {
    return this.accounts.softRemove(entity);
  }

  recordChange(entity: Partial<BalanceChange>): Promise<BalanceChange> {
    return this.changes.save(this.changes.create(entity));
  }

  listChanges(accountId: string, limit = 50): Promise<BalanceChange[]> {
    return this.changes.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
