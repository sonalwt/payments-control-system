import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './country.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { BusinessUnit } from '../business-units/business-unit.entity';
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
    @InjectRepository(LegalEntity) private readonly legalEntitiesRepo: Repository<LegalEntity>,
    @InjectRepository(BusinessUnit) private readonly buRepo: Repository<BusinessUnit>,
  ) {}

  async create(dto: CreateCountryDto, userId: string): Promise<Country> {
    const le = await this.legalEntitiesRepo.findOne({ where: { id: dto.legalEntityId } });
    if (!le) {
      throw new NotFoundException(`Legal entity ${dto.legalEntityId} not found`);
    }
    const dup = await this.repo.findOne({
      where: { legalEntityId: dto.legalEntityId, isoCode: dto.isoCode },
    });
    if (dup) {
      throw new ConflictException(
        `Country ${dto.isoCode} already attached to this legal entity`,
      );
    }
    const entity = this.repo.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(
    query: PaginationQueryDto & { legalEntityId?: string },
  ): Promise<PaginatedResult<Country>> {
    const { page = 1, limit = 20, search, legalEntityId } = query;
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.legalEntity', 'legalEntity')
      .orderBy('c.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (legalEntityId) {
      qb.andWhere('c.legalEntityId = :leId', { leId: legalEntityId });
    }
    if (search) {
      qb.andWhere('(c.name ILIKE :s OR c.isoCode ILIKE :s)', { s: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Country> {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['legalEntity', 'businessUnits'],
    });
    if (!c) throw new NotFoundException(`Country ${id} not found`);
    return c;
  }

  async update(id: string, dto: UpdateCountryDto, userId: string): Promise<Country> {
    const country = await this.findOne(id);
    if (dto.legalEntityId && dto.legalEntityId !== country.legalEntityId) {
      const le = await this.legalEntitiesRepo.findOne({ where: { id: dto.legalEntityId } });
      if (!le) throw new NotFoundException(`Legal entity ${dto.legalEntityId} not found`);
    }
    if (dto.isoCode && dto.isoCode !== country.isoCode) {
      const dup = await this.repo.findOne({
        where: {
          legalEntityId: dto.legalEntityId ?? country.legalEntityId,
          isoCode: dto.isoCode,
        },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException('Country already attached to this legal entity');
      }
    }
    Object.assign(country, dto, { updatedBy: userId });
    return this.repo.save(country);
  }

  async remove(id: string, userId: string): Promise<void> {
    const c = await this.findOne(id);
    const children = await this.buRepo.count({ where: { countryId: id } });
    if (children > 0) {
      throw new BadRequestException(
        `Cannot delete country: ${children} business unit(s) still attached`,
      );
    }
    c.updatedBy = userId;
    await this.repo.save(c);
    await this.repo.softRemove(c);
  }
}
