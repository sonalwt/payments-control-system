import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country) private readonly repo: Repository<Country>,
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
}
