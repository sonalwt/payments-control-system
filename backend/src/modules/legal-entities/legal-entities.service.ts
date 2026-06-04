import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalEntity } from './legal-entity.entity';
import { Country } from '../countries/country.entity';
import { CreateLegalEntityDto } from './dto/create-legal-entity.dto';
import { UpdateLegalEntityDto } from './dto/update-legal-entity.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { ImportResult, parseImportFile } from '../../common/helpers/parse-import-file';

@Injectable()
export class LegalEntitiesService {
  constructor(
    @InjectRepository(LegalEntity)
    private readonly repo: Repository<LegalEntity>,
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
  ) {}

  async create(dto: CreateLegalEntityDto, actorId: string): Promise<LegalEntity> {
    if (await this.repo.findOne({ where: { code: dto.code } })) {
      throw new ConflictException(
        `Legal entity with code "${dto.code}" already exists`,
      );
    }
    const entity = this.repo.create({
      name: dto.name,
      code: dto.code,
      countryId: dto.countryId,
      isActive: dto.isActive ?? true,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(entity);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<LegalEntity>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('le')
      .leftJoinAndSelect('le.country', 'country')
      .orderBy('le.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('(le.name ILIKE :s OR le.code ILIKE :s)', { s: `%${search}%` });
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

  async findOne(id: string): Promise<LegalEntity> {
    const le = await this.repo.findOne({ where: { id }, relations: ['country'] });
    if (!le) throw new NotFoundException(`Legal entity ${id} not found`);
    return le;
  }

  async update(
    id: string,
    dto: UpdateLegalEntityDto,
    actorId: string,
  ): Promise<LegalEntity> {
    const le = await this.findOne(id);
    if (dto.code && dto.code !== le.code) {
      const dup = await this.repo.findOne({ where: { code: dto.code } });
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Legal entity with code "${dto.code}" already exists`,
        );
      }
    }
    Object.assign(le, dto, { updatedBy: actorId });
    return this.repo.save(le);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const le = await this.findOne(id);
    le.updatedBy = actorId;
    await this.repo.save(le);
    await this.repo.softRemove(le);
  }

  async bulkImport(file: Express.Multer.File, actorId: string): Promise<ImportResult> {
    const rows = parseImportFile(file);
    const countries = await this.countryRepo.find({ select: ['id', 'code'] });
    const countryMap = new Map(countries.map((c) => [c.code.toUpperCase(), c.id]));
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['name']; const code = (row['code'] ?? '').toUpperCase();
      if (!name) { result.errors.push({ row: i + 2, message: 'name is required' }); result.skipped++; continue; }
      if (!code) { result.errors.push({ row: i + 2, message: 'code is required' }); result.skipped++; continue; }
      const countryCode = (row['country_code'] ?? '').toUpperCase();
      const countryId = countryMap.get(countryCode);
      if (!countryId) { result.errors.push({ row: i + 2, message: `Country code "${countryCode}" not found` }); result.skipped++; continue; }
      try {
        await this.create({ name, code, countryId, isActive: row['is_active'] !== 'false' }, actorId);
        result.created++;
      } catch (e: unknown) {
        result.errors.push({ row: i + 2, message: e instanceof Error ? e.message : 'Unknown error' });
        result.skipped++;
      }
    }
    return result;
  }
}
