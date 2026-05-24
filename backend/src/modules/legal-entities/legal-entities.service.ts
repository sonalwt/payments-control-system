import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { LegalEntity } from './legal-entity.entity';
import { Group } from '../groups/group.entity';
import { Currency } from '../currencies/currency.entity';
import { Country } from '../countries/country.entity';
import { CreateLegalEntityDto } from './dto/create-legal-entity.dto';
import { UpdateLegalEntityDto } from './dto/update-legal-entity.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class LegalEntitiesService {
  constructor(
    @InjectRepository(LegalEntity) private readonly repo: Repository<LegalEntity>,
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(Currency) private readonly currenciesRepo: Repository<Currency>,
    @InjectRepository(Country) private readonly countriesRepo: Repository<Country>,
  ) {}

  async create(dto: CreateLegalEntityDto, userId: string): Promise<LegalEntity> {
    const group = await this.groupsRepo.findOne({ where: { id: dto.groupId } });
    if (!group) {
      throw new NotFoundException(`Group ${dto.groupId} not found`);
    }
    const currency = await this.currenciesRepo.findOne({ where: { id: dto.baseCurrencyId } });
    if (!currency) {
      throw new NotFoundException(`Currency ${dto.baseCurrencyId} not found`);
    }
    const dupName = await this.repo.findOne({
      where: { groupId: dto.groupId, name: dto.name },
    });
    if (dupName) {
      throw new ConflictException(
        `Legal entity "${dto.name}" already exists under this group`,
      );
    }
    const dupCode = await this.repo.findOne({
      where: { groupId: dto.groupId, code: dto.code },
    });
    if (dupCode) {
      throw new ConflictException(
        `Legal entity code "${dto.code}" already exists under this group`,
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
    query: PaginationQueryDto & { groupId?: string },
  ): Promise<PaginatedResult<LegalEntity>> {
    const { page = 1, limit = 20, search, groupId } = query;
    const qb = this.repo
      .createQueryBuilder('le')
      .leftJoinAndSelect('le.group', 'group')
      .leftJoinAndSelect('le.baseCurrency', 'currency')
      .orderBy('le.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (groupId) {
      qb.andWhere('le.groupId = :groupId', { groupId });
    }
    if (search) {
      qb.andWhere('(le.name ILIKE :s OR le.code ILIKE :s)', { s: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<LegalEntity> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['group', 'baseCurrency', 'countries'],
    });
    if (!entity) {
      throw new NotFoundException(`Legal entity ${id} not found`);
    }
    return entity;
  }

  async update(
    id: string,
    dto: UpdateLegalEntityDto,
    userId: string,
  ): Promise<LegalEntity> {
    const entity = await this.findOne(id);

    if (dto.groupId && dto.groupId !== entity.groupId) {
      const grp = await this.groupsRepo.findOne({ where: { id: dto.groupId } });
      if (!grp) throw new NotFoundException(`Group ${dto.groupId} not found`);
    }
    if (dto.baseCurrencyId && dto.baseCurrencyId !== entity.baseCurrencyId) {
      const cur = await this.currenciesRepo.findOne({ where: { id: dto.baseCurrencyId } });
      if (!cur) throw new NotFoundException(`Currency ${dto.baseCurrencyId} not found`);
    }
    if (dto.name && dto.name !== entity.name) {
      const dup = await this.repo.findOne({
        where: { groupId: dto.groupId ?? entity.groupId, name: dto.name },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException('Legal entity name already exists under this group');
      }
    }
    if (dto.code && dto.code !== entity.code) {
      const dup = await this.repo.findOne({
        where: { groupId: dto.groupId ?? entity.groupId, code: dto.code },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException('Legal entity code already exists under this group');
      }
    }
    Object.assign(entity, dto, { updatedBy: userId });
    return this.repo.save(entity);
  }

  async remove(id: string, userId: string): Promise<void> {
    const entity = await this.findOne(id);
    const childCount = await this.countriesRepo.count({
      where: { legalEntityId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete legal entity: ${childCount} country(ies) still attached`,
      );
    }
    entity.updatedBy = userId;
    await this.repo.save(entity);
    await this.repo.softRemove(entity);
  }
}
