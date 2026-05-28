import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessUnit } from './business-unit.entity';
import { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import { UpdateBusinessUnitDto } from './dto/update-business-unit.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class BusinessUnitsService {
  constructor(
    @InjectRepository(BusinessUnit)
    private readonly repo: Repository<BusinessUnit>,
  ) {}

  async create(dto: CreateBusinessUnitDto, actorId: string): Promise<BusinessUnit> {
    if (await this.repo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException(`Business unit "${dto.name}" already exists`);
    }
    const bu = this.repo.create({
      name: dto.name,
      legalEntityId: dto.legalEntityId,
      isActive: dto.isActive ?? true,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(bu);
  }

  async findAll(
    query: PaginationQueryDto & { legalEntityId?: string },
  ): Promise<PaginatedResult<BusinessUnit>> {
    const { page = 1, limit = 50, search, legalEntityId } = query;
    const qb = this.repo
      .createQueryBuilder('bu')
      .leftJoinAndSelect('bu.legalEntity', 'legalEntity')
      .orderBy('bu.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('bu.name ILIKE :s', { s: `%${search}%` });
    }
    if (legalEntityId) {
      qb.andWhere('bu.legalEntityId = :leId', { leId: legalEntityId });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<BusinessUnit> {
    const bu = await this.repo.findOne({ where: { id }, relations: ['legalEntity'] });
    if (!bu) throw new NotFoundException(`Business unit ${id} not found`);
    return bu;
  }

  async update(id: string, dto: UpdateBusinessUnitDto, actorId: string): Promise<BusinessUnit> {
    const bu = await this.findOne(id);
    if (dto.name && dto.name !== bu.name) {
      const dup = await this.repo.findOne({ where: { name: dto.name } });
      if (dup && dup.id !== id) {
        throw new ConflictException(`Business unit "${dto.name}" already exists`);
      }
    }
    Object.assign(bu, dto, { updatedBy: actorId });
    return this.repo.save(bu);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const bu = await this.findOne(id);
    bu.updatedBy = actorId;
    await this.repo.save(bu);
    await this.repo.softRemove(bu);
  }
}
