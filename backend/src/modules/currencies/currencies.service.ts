import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './currency.entity';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { parseImportFile, ImportResult } from '../../common/helpers/parse-import-file';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(Currency)
    private readonly repo: Repository<Currency>,
  ) {}

  async create(dto: CreateCurrencyDto, actorId: string): Promise<Currency> {
    if (await this.repo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException(
        `Currency "${dto.name}" already exists`,
      );
    }
    const currency = this.repo.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(currency);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Currency>> {
    const { page = 1, limit = 200, search } = query;
    const qb = this.repo
      .createQueryBuilder('c')
      .orderBy('c.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('c.name ILIKE :s', { s: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Currency> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Currency ${id} not found`);
    return c;
  }

  async update(
    id: string,
    dto: UpdateCurrencyDto,
    actorId: string,
  ): Promise<Currency> {
    const currency = await this.findOne(id);
    if (dto.name && dto.name !== currency.name) {
      const dup = await this.repo.findOne({ where: { name: dto.name } });
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Currency "${dto.name}" already exists`,
        );
      }
    }
    Object.assign(currency, dto, { updatedBy: actorId });
    return this.repo.save(currency);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const currency = await this.findOne(id);
    currency.updatedBy = actorId;
    await this.repo.save(currency);
    await this.repo.softRemove(currency);
  }

  async bulkImport(file: Express.Multer.File, actorId: string): Promise<ImportResult> {
    const rows = parseImportFile(file);
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['name'];
      if (!name) { result.errors.push({ row: i + 2, message: 'name is required' }); result.skipped++; continue; }
      const isActive = row['is_active'] !== 'false';
      try {
        await this.create({ name, isActive }, actorId);
        result.created++;
      } catch (e: unknown) {
        result.errors.push({ row: i + 2, message: e instanceof Error ? e.message : 'Unknown error' });
        result.skipped++;
      }
    }
    return result;
  }
}
