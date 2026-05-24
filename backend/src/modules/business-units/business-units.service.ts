import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessUnit } from './business-unit.entity';
import { Country } from '../countries/country.entity';
import { Department } from '../departments/department.entity';
import { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import { UpdateBusinessUnitDto } from './dto/update-business-unit.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class BusinessUnitsService {
  constructor(
    @InjectRepository(BusinessUnit) private readonly repo: Repository<BusinessUnit>,
    @InjectRepository(Country) private readonly countriesRepo: Repository<Country>,
    @InjectRepository(Department) private readonly deptRepo: Repository<Department>,
  ) {}

  async create(dto: CreateBusinessUnitDto, userId: string): Promise<BusinessUnit> {
    const country = await this.countriesRepo.findOne({ where: { id: dto.countryId } });
    if (!country) throw new NotFoundException(`Country ${dto.countryId} not found`);

    if (await this.repo.findOne({ where: { countryId: dto.countryId, name: dto.name } })) {
      throw new ConflictException(`Business unit "${dto.name}" already exists in this country`);
    }
    if (await this.repo.findOne({ where: { countryId: dto.countryId, code: dto.code } })) {
      throw new ConflictException(`Business unit code "${dto.code}" already exists in this country`);
    }
    const entity = this.repo.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(
    query: PaginationQueryDto & { countryId?: string },
  ): Promise<PaginatedResult<BusinessUnit>> {
    const { page = 1, limit = 20, search, countryId } = query;
    const qb = this.repo
      .createQueryBuilder('bu')
      .leftJoinAndSelect('bu.country', 'country')
      .orderBy('bu.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (countryId) qb.andWhere('bu.countryId = :countryId', { countryId });
    if (search) qb.andWhere('(bu.name ILIKE :s OR bu.code ILIKE :s)', { s: `%${search}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<BusinessUnit> {
    const bu = await this.repo.findOne({
      where: { id },
      relations: ['country', 'departments'],
    });
    if (!bu) throw new NotFoundException(`Business unit ${id} not found`);
    return bu;
  }

  async update(
    id: string,
    dto: UpdateBusinessUnitDto,
    userId: string,
  ): Promise<BusinessUnit> {
    const bu = await this.findOne(id);
    if (dto.countryId && dto.countryId !== bu.countryId) {
      const country = await this.countriesRepo.findOne({ where: { id: dto.countryId } });
      if (!country) throw new NotFoundException(`Country ${dto.countryId} not found`);
    }
    if (dto.name && dto.name !== bu.name) {
      const dup = await this.repo.findOne({
        where: { countryId: dto.countryId ?? bu.countryId, name: dto.name },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException('Business unit name already exists in this country');
      }
    }
    if (dto.code && dto.code !== bu.code) {
      const dup = await this.repo.findOne({
        where: { countryId: dto.countryId ?? bu.countryId, code: dto.code },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException('Business unit code already exists in this country');
      }
    }
    Object.assign(bu, dto, { updatedBy: userId });
    return this.repo.save(bu);
  }

  async remove(id: string, userId: string): Promise<void> {
    const bu = await this.findOne(id);
    const children = await this.deptRepo.count({ where: { businessUnitId: id } });
    if (children > 0) {
      throw new BadRequestException(
        `Cannot delete business unit: ${children} department(s) still attached`,
      );
    }
    bu.updatedBy = userId;
    await this.repo.save(bu);
    await this.repo.softRemove(bu);
  }
}
