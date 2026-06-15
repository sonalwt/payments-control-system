import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './country.entity';
import { Currency } from '../currencies/currency.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { ImportResult, parseImportFile } from '../../common/helpers/parse-import-file';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country) private readonly repo: Repository<Country>,
    @InjectRepository(Currency) private readonly currencyRepo: Repository<Currency>,
  ) {}

  async create(dto: CreateCountryDto, actorId: string): Promise<Country> {
    if (await this.repo.findOne({ where: { code: dto.code } })) {
      throw new ConflictException(
        `Country with code "${dto.code}" already exists`,
      );
    }
    const country = this.repo.create({
      countryName: dto.countryName,
      countryShortName: dto.countryShortName,
      code: dto.code,
      currencyId: dto.currencyId,
      isActive: dto.isActive ?? true,
      isSanctioned: dto.isSanctioned ?? false,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(country);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Country>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.currency', 'currency')
      .orderBy('c.countryName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere(
        '(c.countryName ILIKE :s OR c.countryShortName ILIKE :s OR c.code ILIKE :s)',
        { s: `%${search}%` },
      );
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

  async findOne(id: string): Promise<Country> {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['currency'],
    });
    if (!c) throw new NotFoundException(`Country ${id} not found`);
    return c;
  }

  async update(
    id: string,
    dto: UpdateCountryDto,
    actorId: string,
  ): Promise<Country> {
    const country = await this.findOne(id);
    if (dto.code && dto.code !== country.code) {
      const dup = await this.repo.findOne({ where: { code: dto.code } });
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Country with code "${dto.code}" already exists`,
        );
      }
    }
    Object.assign(country, dto, { updatedBy: actorId });
    return this.repo.save(country);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const country = await this.findOne(id);
    country.updatedBy = actorId;
    await this.repo.save(country);
    await this.repo.softRemove(country);
  }

  async bulkImport(file: Express.Multer.File, actorId: string): Promise<ImportResult> {
    const rows = parseImportFile(file);
    const currencies = await this.currencyRepo.find({ select: ['id', 'code'] });
    const currencyMap = new Map(currencies.filter(c => c.code).map((c) => [c.code!.toUpperCase(), c.id]));
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const countryName = row['country_name'];
      if (!countryName) { result.errors.push({ row: i + 2, message: 'country_name is required' }); result.skipped++; continue; }
      const countryShortName = row['country_short_name'];
      if (!countryShortName) { result.errors.push({ row: i + 2, message: 'country_short_name is required' }); result.skipped++; continue; }
      const code = (row['code'] ?? '').toUpperCase();
      if (!code) { result.errors.push({ row: i + 2, message: 'code is required' }); result.skipped++; continue; }
      const currencyCode = (row['currency_code'] ?? '').toUpperCase();
      const currencyId = currencyMap.get(currencyCode);
      if (!currencyId) { result.errors.push({ row: i + 2, message: `Currency code "${currencyCode}" not found` }); result.skipped++; continue; }
      try {
        await this.create({ countryName, countryShortName, code, currencyId, isActive: row['is_active'] !== 'false', isSanctioned: row['is_sanctioned'] === 'true' }, actorId);
        result.created++;
      } catch (e: unknown) {
        result.errors.push({ row: i + 2, message: e instanceof Error ? e.message : 'Unknown error' });
        result.skipped++;
      }
    }
    return result;
  }
}
