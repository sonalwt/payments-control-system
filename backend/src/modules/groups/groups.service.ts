import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { GroupRepository } from './group.repository';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { LegalEntity } from '../legal-entities/legal-entity.entity';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepo: GroupRepository,
    @InjectRepository(LegalEntity)
    private readonly legalEntitiesRepo: Repository<LegalEntity>,
  ) {}

  async create(dto: CreateGroupDto, userId: string): Promise<Group> {
    const [existingByName, existingByCode] = await Promise.all([
      this.groupsRepo.findByName(dto.name),
      this.groupsRepo.findByCode(dto.code),
    ]);
    if (existingByName) {
      throw new ConflictException(`Group name "${dto.name}" already exists`);
    }
    if (existingByCode) {
      throw new ConflictException(`Group code "${dto.code}" already exists`);
    }
    const entity = this.groupsRepo.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.groupsRepo.save(entity);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Group>> {
    const { page = 1, limit = 20, search } = query;
    const [data, total] = await this.groupsRepo.raw.findAndCount({
      where: search
        ? [{ name: ILike(`%${search}%`) }, { code: ILike(`%${search}%`) }]
        : undefined,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupsRepo.findOneById(id);
    if (!group) {
      throw new NotFoundException(`Group ${id} not found`);
    }
    return group;
  }

  async update(id: string, dto: UpdateGroupDto, userId: string): Promise<Group> {
    const group = await this.findOne(id);
    if (dto.name && dto.name !== group.name) {
      const existing = await this.groupsRepo.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Group name "${dto.name}" already exists`);
      }
    }
    if (dto.code && dto.code !== group.code) {
      const existing = await this.groupsRepo.findByCode(dto.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Group code "${dto.code}" already exists`);
      }
    }
    Object.assign(group, dto, { updatedBy: userId });
    return this.groupsRepo.save(group);
  }

  async remove(id: string, userId: string): Promise<void> {
    const group = await this.findOne(id);
    const childCount = await this.legalEntitiesRepo.count({
      where: { groupId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete group: ${childCount} legal entity(ies) still attached`,
      );
    }
    group.updatedBy = userId;
    await this.groupsRepo.raw.save(group);
    await this.groupsRepo.softRemove(group);
  }
}
