import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { Bank } from './bank.entity';
import { BanksRepository } from './banks.repository';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface BankQuery extends PaginationQueryDto {
  countryCode?: string;
  isActive?: 'true' | 'false';
}

@Injectable()
export class BanksService {
  constructor(private readonly repo: BanksRepository) {}

  async create(dto: CreateBankDto, userId: string): Promise<Bank> {
    const dup = await this.repo.findByNameAndCountry(dto.name, dto.countryCode);
    if (dup) {
      throw new ConflictException(
        `Bank "${dto.name}" already exists for country ${dto.countryCode.toUpperCase()}.`,
      );
    }
    const entity = this.repo.create({
      name: dto.name,
      shortName: dto.shortName ?? null,
      countryCode: dto.countryCode.toUpperCase(),
      swiftBic: dto.swiftBic ? dto.swiftBic.toUpperCase() : null,
      address: dto.address ?? null,
      isActive: dto.isActive ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(query: BankQuery): Promise<PaginatedResult<Bank>> {
    const { page = 1, limit = 20, search, countryCode, isActive } = query;
    const where: Record<string, unknown> = {};
    if (countryCode) where.countryCode = countryCode.toUpperCase();
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const baseWhere = search
      ? [
          { ...where, name: ILike(`%${search}%`) },
          { ...where, swiftBic: ILike(`%${search}%`) },
          { ...where, shortName: ILike(`%${search}%`) },
        ]
      : Object.keys(where).length > 0
        ? where
        : undefined;

    const [data, total] = await this.repo.raw.findAndCount({
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Bank> {
    const b = await this.repo.findOneById(id);
    if (!b) throw new NotFoundException(`Bank ${id} not found`);
    return b;
  }

  async update(
    id: string,
    dto: UpdateBankDto,
    userId: string,
  ): Promise<Bank> {
    const b = await this.findOne(id);
    Object.assign(b, {
      ...dto,
      countryCode: dto.countryCode
        ? dto.countryCode.toUpperCase()
        : b.countryCode,
      swiftBic:
        dto.swiftBic !== undefined
          ? dto.swiftBic
            ? dto.swiftBic.toUpperCase()
            : null
          : b.swiftBic,
      updatedBy: userId,
    });
    return this.repo.save(b);
  }

  async remove(id: string, userId: string): Promise<void> {
    const b = await this.findOne(id);
    b.updatedBy = userId;
    await this.repo.save(b);
    await this.repo.softRemove(b);
  }
}
