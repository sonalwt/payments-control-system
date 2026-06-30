import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { BankAccountChargeBand } from './bank-account-charge-band.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { ChargeBandDto, CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly repo: Repository<BankAccount>,
    @InjectRepository(BankAccountChargeBand)
    private readonly bandRepo: Repository<BankAccountChargeBand>,
    @InjectRepository(LegalEntity)
    private readonly legalEntityRepo: Repository<LegalEntity>,
  ) {}

  /**
   * The account name for a group-own account is its legal entity. Resolve the
   * entity name to mirror into bank_nickname (the cached display/search name).
   * Returns undefined when no legal entity is provided (e.g. counterparty
   * accounts, which keep their own nickname).
   */
  private async resolveNicknameFromLegalEntity(
    legalEntityId?: string | null,
  ): Promise<string | undefined> {
    if (!legalEntityId) return undefined;
    const le = await this.legalEntityRepo.findOne({ where: { id: legalEntityId } });
    if (!le) throw new BadRequestException('Selected legal entity was not found.');
    return le.name;
  }

  /**
   * Validate the charge bands and return them ordered by minAmount with a
   * dense sortOrder. Rejects overlapping-shape mistakes (max <= min, more than
   * one open-ended band).
   */
  private buildChargeBands(bands?: ChargeBandDto[]): BankAccountChargeBand[] {
    if (!bands || bands.length === 0) return [];
    const openEnded = bands.filter((b) => b.maxAmount == null);
    if (openEnded.length > 1) {
      throw new BadRequestException('At most one open-ended charge band (no max amount) is allowed');
    }
    for (const b of bands) {
      if (b.maxAmount != null && b.maxAmount <= b.minAmount) {
        throw new BadRequestException(
          `Charge band max amount (${b.maxAmount}) must be greater than its min amount (${b.minAmount})`,
        );
      }
    }
    return [...bands]
      .sort((a, b) => a.minAmount - b.minAmount)
      .map((b, i) =>
        this.bandRepo.create({
          sortOrder: i,
          minAmount: b.minAmount,
          maxAmount: b.maxAmount ?? null,
          percentage: b.percentage,
        }),
      );
  }

  async create(
    dto: CreateBankAccountDto,
    actorId: string,
    isCounterparty = false,
  ): Promise<BankAccount> {
    const existing = await this.repo.findOne({
      where: {
        accountNumber: dto.accountNumber,
        bankId: dto.bankId,
        isCounterparty,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Bank account ${dto.accountNumber} already exists for this bank`,
      );
    }
    const derivedNickname = await this.resolveNicknameFromLegalEntity(dto.legalEntityId);
    const acc = this.repo.create({
      bankId: dto.bankId,
      legalEntityId: dto.legalEntityId ?? null,
      // Account name comes from the legal entity for group accounts; counterparty
      // accounts fall back to their typed nickname.
      bankNickname: derivedNickname ?? dto.bankNickname ?? null,
      currencyId: dto.currencyId,
      accountTypeId: dto.accountTypeId,
      accountNumber: dto.accountNumber,
      branchName: dto.branchName ?? null,
      branchCode: dto.branchCode ?? null,
      openingBalance: dto.openingBalance ?? 0,
      minimumBalance: dto.minimumBalance ?? 0,
      remainingBalance: dto.remainingBalance ?? 0,
      isChairmanDesignated: dto.isChairmanDesignated ?? false,
      isActive: dto.isActive ?? true,
      isCounterparty,
      counterpartyId: isCounterparty ? dto.counterpartyId : null,
      chargeBands: this.buildChargeBands(dto.chargeBands),
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(acc);
  }

  async findAll(
    query: PaginationQueryDto,
    isCounterparty = false,
  ): Promise<PaginatedResult<BankAccount>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.bank', 'bank')
      .leftJoinAndSelect('a.currency', 'currency')
      .leftJoinAndSelect('a.legalEntity', 'legalEntity')
      .leftJoinAndSelect('a.accountTypeMaster', 'accountTypeMaster')
      .leftJoinAndSelect('a.counterparty', 'counterparty')
      .leftJoinAndSelect('a.chargeBands', 'chargeBands')
      .where('a.isCounterparty = :isCounterparty', { isCounterparty })
      .orderBy('a.bankNickname', 'ASC')
      .addOrderBy('chargeBands.sortOrder', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere(
        '(a.bankNickname ILIKE :s OR bank.name ILIKE :s OR a.accountNumber ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Active group-own accounts whose remaining balance has fallen below their
   * configured minimum balance — used for the admin dashboard alert.
   */
  async findBelowMinimum(): Promise<BankAccount[]> {
    return this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.bank', 'bank')
      .leftJoinAndSelect('a.currency', 'currency')
      .where('a.isCounterparty = false')
      .andWhere('a.isActive = true')
      .andWhere('a.remainingBalance < a.minimumBalance')
      .orderBy('a.bankNickname', 'ASC')
      .getMany();
  }

  async findOne(id: string, isCounterparty = false): Promise<BankAccount> {
    const acc = await this.repo.findOne({
      where: { id, isCounterparty },
      relations: ['bank', 'currency', 'legalEntity', 'accountTypeMaster', 'counterparty', 'chargeBands'],
      order: { chargeBands: { sortOrder: 'ASC' } },
    });
    if (!acc) throw new NotFoundException(`Bank account ${id} not found`);
    return acc;
  }

  async update(
    id: string,
    dto: UpdateBankAccountDto,
    actorId: string,
    isCounterparty = false,
  ): Promise<BankAccount> {
    const acc = await this.findOne(id, isCounterparty);
    const { chargeBands, ...rest } = dto;
    Object.assign(acc, rest, { updatedBy: actorId });
    // Keep the cached account name (bank_nickname) in sync with the legal entity.
    if (dto.legalEntityId !== undefined) {
      acc.legalEntityId = dto.legalEntityId ?? null;
      const nick = await this.resolveNicknameFromLegalEntity(dto.legalEntityId);
      if (nick) acc.bankNickname = nick;
    }
    // Replace the charge bands wholesale when provided (cascade does not remove
    // orphans, so drop the old rows first).
    if (chargeBands !== undefined) {
      await this.bandRepo.delete({ bankAccountId: id });
      acc.chargeBands = this.buildChargeBands(chargeBands);
    }
    return this.repo.save(acc);
  }

  async remove(id: string, actorId: string, isCounterparty = false): Promise<void> {
    const acc = await this.findOne(id, isCounterparty);
    acc.updatedBy = actorId;
    await this.repo.save(acc);
    await this.repo.softRemove(acc);
  }
}
