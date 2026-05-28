import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee) private readonly repo: Repository<Employee>,
  ) {}

  async create(dto: CreateEmployeeDto, actorId: string): Promise<Employee> {
    if (await this.repo.findOne({ where: { employeeCode: dto.employeeCode } })) {
      throw new ConflictException(
        `Employee with code "${dto.employeeCode}" already exists`,
      );
    }
    if (await this.repo.findOne({ where: { workEmail: dto.workEmail } })) {
      throw new ConflictException(
        `Employee with email "${dto.workEmail}" already exists`,
      );
    }
    const emp = this.repo.create({
      employeeCode: dto.employeeCode,
      fullName: dto.fullName,
      workEmail: dto.workEmail,
      countryOfEmploymentId: dto.countryOfEmploymentId,
      departmentId: dto.departmentId,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      nationalId: dto.nationalId ?? null,
      taxIdentifier: dto.taxIdentifier ?? null,
      dateOfBirth: dto.dateOfBirth ?? null,
      mobileNumber: dto.mobileNumber ?? null,
      address: dto.address ?? null,
      compensationBand: dto.compensationBand ?? null,
      isActive: dto.isActive ?? true,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(emp);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Employee>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.countryOfEmployment', 'countryOfEmployment')
      .leftJoinAndSelect('e.department', 'department')
      .orderBy('e.fullName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere(
        '(e.fullName ILIKE :s OR e.employeeCode ILIKE :s OR e.workEmail ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Employee> {
    const e = await this.repo.findOne({
      where: { id },
      relations: ['countryOfEmployment', 'department'],
    });
    if (!e) throw new NotFoundException(`Employee ${id} not found`);
    return e;
  }

  async update(id: string, dto: UpdateEmployeeDto, actorId: string): Promise<Employee> {
    const emp = await this.findOne(id);
    if (dto.employeeCode && dto.employeeCode !== emp.employeeCode) {
      const dup = await this.repo.findOne({
        where: { employeeCode: dto.employeeCode },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Employee with code "${dto.employeeCode}" already exists`,
        );
      }
    }
    if (dto.workEmail && dto.workEmail !== emp.workEmail) {
      const dup = await this.repo.findOne({
        where: { workEmail: dto.workEmail },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Employee with email "${dto.workEmail}" already exists`,
        );
      }
    }
    Object.assign(emp, dto, { updatedBy: actorId });
    return this.repo.save(emp);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const emp = await this.findOne(id);
    emp.updatedBy = actorId;
    await this.repo.save(emp);
    await this.repo.softRemove(emp);
  }
}
