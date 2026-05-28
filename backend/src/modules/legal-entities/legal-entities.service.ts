import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalEntity } from './legal-entity.entity';
import { CreateLegalEntityDto } from './dto/create-legal-entity.dto';
import { UpdateLegalEntityDto } from './dto/update-legal-entity.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class LegalEntitiesService {
  constructor(
    @InjectRepository(LegalEntity)
    private readonly repo: Repository<LegalEntity>,
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
    const le = await this.repo.findOne({ where: { id } });
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
}
