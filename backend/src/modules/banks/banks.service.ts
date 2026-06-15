import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bank } from './bank.entity';
import { Country } from '../countries/country.entity';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { ImportResult, parseImportFile } from '../../common/helpers/parse-import-file';

@Injectable()
export class BanksService {
  constructor(
    @InjectRepository(Bank) private readonly repo: Repository<Bank>,
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
  ) {}

  async create(
    dto: CreateBankDto,
    actorId: string,
    isCounterparty = false,
  ): Promise<Bank> {
    const dup = await this.repo.findOne({
      where: { name: dto.name, countryId: dto.countryId, isCounterparty },
    });
    if (dup) {
      throw new ConflictException(
        `Bank "${dto.name}" already exists for this country`,
      );
    }
    const bank = this.repo.create({
      name: dto.name,
      shortName: dto.shortName ?? null,
      countryId: dto.countryId,
      swiftBic: dto.swiftBic ?? null,
      isActive: dto.isActive ?? true,
      isCounterparty,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(bank);
  }

  async findAll(
    query: PaginationQueryDto,
    isCounterparty = false,
  ): Promise<PaginatedResult<Bank>> {
    const { page = 1, limit = 50, search } = query;
    const qb = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.country', 'country')
      .where('b.isCounterparty = :isCounterparty', { isCounterparty })
      .orderBy('b.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere(
        '(b.name ILIKE :s OR b.shortName ILIKE :s OR b.swiftBic ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, isCounterparty = false): Promise<Bank> {
    const b = await this.repo.findOne({
      where: { id, isCounterparty },
      relations: ['country'],
    });
    if (!b) throw new NotFoundException(`Bank ${id} not found`);
    return b;
  }

  async update(
    id: string,
    dto: UpdateBankDto,
    actorId: string,
    isCounterparty = false,
  ): Promise<Bank> {
    const bank = await this.findOne(id, isCounterparty);
    const nextName = dto.name ?? bank.name;
    const nextCountry = dto.countryId ?? bank.countryId;
    if (nextName !== bank.name || nextCountry !== bank.countryId) {
      const dup = await this.repo.findOne({
        where: { name: nextName, countryId: nextCountry, isCounterparty },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Bank "${nextName}" already exists for this country`,
        );
      }
    }
    Object.assign(bank, dto, { updatedBy: actorId });
    return this.repo.save(bank);
  }

  async remove(id: string, actorId: string, isCounterparty = false): Promise<void> {
    const bank = await this.findOne(id, isCounterparty);
    bank.updatedBy = actorId;
    await this.repo.save(bank);
    await this.repo.softRemove(bank);
  }

  async bulkImport(file: Express.Multer.File, actorId: string): Promise<ImportResult> {
    const rows = parseImportFile(file);
    const countries = await this.countryRepo.find({ select: ['id', 'code'] });
    const countryMap = new Map(countries.map((c) => [c.code.toUpperCase(), c.id]));
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['name'];
      if (!name) { result.errors.push({ row: i + 2, message: 'name is required' }); result.skipped++; continue; }
      const countryCode = (row['country_code'] ?? '').toUpperCase();
      const countryId = countryMap.get(countryCode);
      if (!countryId) { result.errors.push({ row: i + 2, message: `Country code "${countryCode}" not found` }); result.skipped++; continue; }
      try {
        await this.create({ name, shortName: row['short_name'] || undefined, countryId, swiftBic: row['swift_bic'] || undefined, isActive: row['is_active'] !== 'false' }, actorId);
        result.created++;
      } catch (e: unknown) {
        result.errors.push({ row: i + 2, message: e instanceof Error ? e.message : 'Unknown error' });
        result.skipped++;
      }
    }
    return result;
  }
}
