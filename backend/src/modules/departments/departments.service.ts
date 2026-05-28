import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly repo: Repository<Department>,
  ) {}

  async create(dto: CreateDepartmentDto, actorId: string): Promise<Department> {
    if (await this.repo.findOne({ where: { code: dto.code } })) {
      throw new ConflictException(
        `Department with code "${dto.code}" already exists`,
      );
    }
    const dept = this.repo.create({
      code: dto.code,
      name: dto.name,
      legalEntityId: dto.legalEntityId,
      businessUnitId: dto.businessUnitId,
      isActive: dto.isActive ?? true,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(dept);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Department>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.legalEntity', 'legalEntity')
      .leftJoinAndSelect('d.businessUnit', 'businessUnit')
      .orderBy('d.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('(d.name ILIKE :s OR d.code ILIKE :s)', { s: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Department> {
    const d = await this.repo.findOne({
      where: { id },
      relations: ['legalEntity', 'businessUnit'],
    });
    if (!d) throw new NotFoundException(`Department ${id} not found`);
    return d;
  }

  async update(id: string, dto: UpdateDepartmentDto, actorId: string): Promise<Department> {
    const dept = await this.findOne(id);
    if (dto.code && dto.code !== dept.code) {
      const dup = await this.repo.findOne({ where: { code: dto.code } });
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Department with code "${dto.code}" already exists`,
        );
      }
    }
    Object.assign(dept, dto, { updatedBy: actorId });
    return this.repo.save(dept);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const dept = await this.findOne(id);
    dept.updatedBy = actorId;
    await this.repo.save(dept);
    await this.repo.softRemove(dept);
  }
}
