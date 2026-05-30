import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
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
  ) {}

  async create(
    dto: CreateBankAccountDto,
    actorId: string,
    isCounterparty = false,
  ): Promise<BankAccount> {
    if (isCounterparty && !dto.counterpartyId) {
      throw new BadRequestException(
        'counterpartyId is required for counterparty bank accounts.',
      );
    }
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
    const acc = this.repo.create({
      bankId: dto.bankId,
      bankNickname: dto.bankNickname ?? null,
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
      .leftJoinAndSelect('a.accountTypeMaster', 'accountTypeMaster')
      .leftJoinAndSelect('a.counterparty', 'counterparty')
      .where('a.isCounterparty = :isCounterparty', { isCounterparty })
      .orderBy('a.bankNickname', 'ASC')
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

  async findOne(id: string, isCounterparty = false): Promise<BankAccount> {
    const acc = await this.repo.findOne({
      where: { id, isCounterparty },
      relations: ['bank', 'currency', 'accountTypeMaster', 'counterparty'],
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
    Object.assign(acc, dto, { updatedBy: actorId });
    return this.repo.save(acc);
  }

  async remove(id: string, actorId: string, isCounterparty = false): Promise<void> {
    const acc = await this.findOne(id, isCounterparty);
    acc.updatedBy = actorId;
    await this.repo.save(acc);
    await this.repo.softRemove(acc);
  }
}
