import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { BusinessUnit } from '../business-units/business-unit.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department) private readonly repo: Repository<Department>,
    @InjectRepository(BusinessUnit) private readonly buRepo: Repository<BusinessUnit>,
  ) {}

  async create(dto: CreateDepartmentDto, userId: string): Promise<Department> {
    const bu = await this.buRepo.findOne({ where: { id: dto.businessUnitId } });
    if (!bu) throw new NotFoundException(`Business unit ${dto.businessUnitId} not found`);

    if (await this.repo.findOne({ where: { businessUnitId: dto.businessUnitId, name: dto.name } })) {
      throw new ConflictException(`Department "${dto.name}" already exists in this business unit`);
    }
    if (await this.repo.findOne({ where: { businessUnitId: dto.businessUnitId, code: dto.code } })) {
      throw new ConflictException(`Department code "${dto.code}" already exists in this business unit`);
    }
    const entity = this.repo.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(
    query: PaginationQueryDto & { businessUnitId?: string },
  ): Promise<PaginatedResult<Department>> {
    const { page = 1, limit = 20, search, businessUnitId } = query;
    const qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.businessUnit', 'businessUnit')
      .orderBy('d.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (businessUnitId) qb.andWhere('d.businessUnitId = :buId', { buId: businessUnitId });
    if (search) qb.andWhere('(d.name ILIKE :s OR d.code ILIKE :s)', { s: `%${search}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Department> {
    const dept = await this.repo.findOne({
      where: { id },
      relations: ['businessUnit'],
    });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, userId: string): Promise<Department> {
    const dept = await this.findOne(id);
    if (dto.businessUnitId && dto.businessUnitId !== dept.businessUnitId) {
      const bu = await this.buRepo.findOne({ where: { id: dto.businessUnitId } });
      if (!bu) throw new NotFoundException(`Business unit ${dto.businessUnitId} not found`);
    }
    if (dto.name && dto.name !== dept.name) {
      const dup = await this.repo.findOne({
        where: { businessUnitId: dto.businessUnitId ?? dept.businessUnitId, name: dto.name },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException('Department name already exists in this business unit');
      }
    }
    if (dto.code && dto.code !== dept.code) {
      const dup = await this.repo.findOne({
        where: { businessUnitId: dto.businessUnitId ?? dept.businessUnitId, code: dto.code },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException('Department code already exists in this business unit');
      }
    }
    Object.assign(dept, dto, { updatedBy: userId });
    return this.repo.save(dept);
  }

  async remove(id: string, userId: string): Promise<void> {
    const dept = await this.findOne(id);
    dept.updatedBy = userId;
    await this.repo.save(dept);
    await this.repo.softRemove(dept);
  }
}
