import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountType } from './account-type.entity';
import { CreateAccountTypeDto } from './dto/create-account-type.dto';
import { UpdateAccountTypeDto } from './dto/update-account-type.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class AccountTypesService {
  constructor(
    @InjectRepository(AccountType)
    private readonly repo: Repository<AccountType>,
  ) {}

  async create(dto: CreateAccountTypeDto, actorId: string): Promise<AccountType> {
    if (await this.repo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException(`Account type "${dto.name}" already exists`);
    }
    const at = this.repo.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(at);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<AccountType>> {
    const { page = 1, limit = 50, search } = query;
    const qb = this.repo
      .createQueryBuilder('at')
      .orderBy('at.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('at.name ILIKE :s', { s: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<AccountType> {
    const at = await this.repo.findOne({ where: { id } });
    if (!at) throw new NotFoundException(`Account type ${id} not found`);
    return at;
  }

  async update(id: string, dto: UpdateAccountTypeDto, actorId: string): Promise<AccountType> {
    const at = await this.findOne(id);
    if (dto.name && dto.name !== at.name) {
      const dup = await this.repo.findOne({ where: { name: dto.name } });
      if (dup && dup.id !== id) {
        throw new ConflictException(`Account type "${dto.name}" already exists`);
      }
    }
    Object.assign(at, dto, { updatedBy: actorId });
    return this.repo.save(at);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const at = await this.findOne(id);
    at.updatedBy = actorId;
    await this.repo.save(at);
    await this.repo.softRemove(at);
  }
}
