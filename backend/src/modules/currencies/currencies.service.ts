import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { Currency } from './currency.entity';
import { CurrenciesRepository } from './currencies.repository';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface CurrencyQuery extends PaginationQueryDto {
  isActive?: 'true' | 'false';
}

@Injectable()
export class CurrenciesService {
  constructor(private readonly repo: CurrenciesRepository) {}

  async create(dto: CreateCurrencyDto, userId: string): Promise<Currency> {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Currency "${dto.code}" already exists.`);
    }
    const entity = this.repo.create({
      code: dto.code,
      name: dto.name,
      numericCode: dto.numericCode ?? null,
      minorUnit: dto.minorUnit ?? 2,
      symbol: dto.symbol ?? null,
      isActive: dto.isActive ?? true,
      isSystem: false,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(query: CurrencyQuery): Promise<PaginatedResult<Currency>> {
    const { page = 1, limit = 50, search, isActive } = query;
    const where: Record<string, unknown> = {};
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const baseWhere = search
      ? [
          { ...where, code: ILike(`%${search}%`) },
          { ...where, name: ILike(`%${search}%`) },
        ]
      : Object.keys(where).length > 0
        ? where
        : undefined;

    const [data, total] = await this.repo.raw.findAndCount({
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
      order: { code: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findOne(id: string): Promise<Currency> {
    return this.requireById(id);
  }

  async findByCodeOrFail(code: string): Promise<Currency> {
    const c = await this.repo.findByCode(code);
    if (!c) throw new NotFoundException(`Currency "${code}" not found`);
    return c;
  }

  async update(
    id: string,
    dto: UpdateCurrencyDto,
    userId: string,
  ): Promise<Currency> {
    const c = await this.requireById(id);
    Object.assign(c, dto, { updatedBy: userId });
    return this.repo.save(c);
  }

  async remove(id: string, userId: string): Promise<void> {
    const c = await this.requireById(id);
    if (c.isSystem) {
      throw new BadRequestException(
        'System currencies cannot be deleted; deactivate it instead.',
      );
    }
    c.updatedBy = userId;
    await this.repo.save(c);
    await this.repo.softRemove(c);
  }

  private async requireById(id: string): Promise<Currency> {
    const c = await this.repo.findOneById(id);
    if (!c) throw new NotFoundException(`Currency ${id} not found`);
    return c;
  }
}
