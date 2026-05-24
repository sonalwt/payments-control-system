import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { SanctionedCountry } from './sanctioned-country.entity';
import { SanctionedCountryRepository } from './sanctioned-country.repository';
import { CreateSanctionedCountryDto } from './dto/create-sanctioned-country.dto';
import { UpdateSanctionedCountryDto } from './dto/update-sanctioned-country.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface SanctionedCountryQuery extends PaginationQueryDto {
  isActive?: 'true' | 'false';
}

@Injectable()
export class SanctionedCountriesService {
  constructor(private readonly repo: SanctionedCountryRepository) {}

  async create(
    dto: CreateSanctionedCountryDto,
    userId: string,
  ): Promise<SanctionedCountry> {
    const existing = await this.repo.findByCountryCode(dto.countryCode);
    if (existing) {
      throw new ConflictException(
        `Country "${dto.countryCode}" is already on the sanctioned list.`,
      );
    }
    const entity = this.repo.create({
      countryCode: dto.countryCode,
      countryName: dto.countryName,
      reason: dto.reason,
      isActive: dto.isActive ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(
    query: SanctionedCountryQuery,
  ): Promise<PaginatedResult<SanctionedCountry>> {
    const { page = 1, limit = 20, search, isActive } = query;
    const where: Record<string, unknown> = {};
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const baseWhere = search
      ? [
          { ...where, countryName: ILike(`%${search}%`) },
          { ...where, countryCode: ILike(`%${search}%`) },
        ]
      : Object.keys(where).length > 0
        ? where
        : undefined;

    const [data, total] = await this.repo.raw.findAndCount({
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
      order: { countryName: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<SanctionedCountry> {
    const sc = await this.repo.findOneById(id);
    if (!sc) {
      throw new NotFoundException(`Sanctioned country ${id} not found`);
    }
    return sc;
  }

  async update(
    id: string,
    dto: UpdateSanctionedCountryDto,
    userId: string,
  ): Promise<SanctionedCountry> {
    const sc = await this.findOne(id);
    Object.assign(sc, dto, { updatedBy: userId });
    return this.repo.save(sc);
  }

  async remove(
    id: string,
    reason: string,
    userId: string,
  ): Promise<void> {
    const sc = await this.findOne(id);
    // Stamp the removal reason on the row before soft-delete so the audit
    // log captures it as the last `new_values` snapshot.
    sc.reason = reason;
    sc.updatedBy = userId;
    await this.repo.save(sc);
    await this.repo.softRemove(sc);
  }
}
