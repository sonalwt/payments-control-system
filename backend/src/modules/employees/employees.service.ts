import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeRepository } from './employee.repository';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { RoleCode } from '../../common/enums/role.enum';

export interface EmployeeQuery extends PaginationQueryDto {
  legalEntityId?: string;
  countryCode?: string;
  payrollCategory?: string;
  isActive?: 'true' | 'false';
}

// Sensitive payroll attributes (§1.4, §15.2). Masked at the API layer unless
// the caller holds a role that grants PAYROLL_PII_ACCESS. Until that
// dedicated permission exists in the role catalogue, SUPER_ADMIN is the sole
// unmasking grantee.
const SENSITIVE_FIELDS = [
  'nationalId',
  'taxIdentifier',
  'dateOfBirth',
  'compensationBand',
] as const satisfies readonly (keyof Employee)[];

const PAYROLL_PII_ROLES: readonly string[] = [RoleCode.SUPER_ADMIN];

@Injectable()
export class EmployeesService {
  constructor(private readonly repo: EmployeeRepository) {}

  async create(dto: CreateEmployeeDto, userId: string): Promise<Employee> {
    const clash = await this.repo.findByCode(dto.legalEntityId, dto.employeeCode);
    if (clash) {
      throw new ConflictException(
        `Employee code "${dto.employeeCode}" already exists in this entity`,
      );
    }

    const entity = this.repo.create({
      employeeCode: dto.employeeCode,
      fullName: dto.fullName,
      preferredName: dto.preferredName ?? null,
      workEmail: dto.workEmail ?? null,
      legalEntityId: dto.legalEntityId,
      countryCode: dto.countryCode,
      baseCurrencyId: dto.baseCurrencyId,
      payrollCategory: dto.payrollCategory,
      employeeBankAccountId: dto.employeeBankAccountId ?? null,
      employmentStartDate: dto.employmentStartDate ?? null,
      employmentEndDate: dto.employmentEndDate ?? null,
      nationalId: dto.nationalId ?? null,
      taxIdentifier: dto.taxIdentifier ?? null,
      dateOfBirth: dto.dateOfBirth ?? null,
      compensationBand: dto.compensationBand ?? null,
      isActive: dto.isActive ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(query: EmployeeQuery): Promise<PaginatedResult<Employee>> {
    const {
      page = 1,
      limit = 20,
      search,
      legalEntityId,
      countryCode,
      payrollCategory,
      isActive,
    } = query;
    const where: Record<string, unknown> = {};
    if (legalEntityId) where.legalEntityId = legalEntityId;
    if (countryCode) where.countryCode = countryCode;
    if (payrollCategory) where.payrollCategory = payrollCategory;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const baseWhere = search
      ? [
          { ...where, fullName: ILike(`%${search}%`) },
          { ...where, employeeCode: ILike(`%${search}%`) },
          { ...where, workEmail: ILike(`%${search}%`) },
        ]
      : Object.keys(where).length > 0
        ? where
        : undefined;

    const [data, total] = await this.repo.raw.findAndCount({
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
      order: { fullName: 'ASC' },
      relations: { legalEntity: true, baseCurrency: true },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Employee> {
    const emp = await this.repo.findOneById(id);
    if (!emp) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return emp;
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
    userId: string,
  ): Promise<Employee> {
    const emp = await this.findOne(id);
    Object.assign(emp, dto, { updatedBy: userId });
    return this.repo.save(emp);
  }

  async remove(id: string, userId: string): Promise<void> {
    const emp = await this.findOne(id);
    emp.updatedBy = userId;
    await this.repo.raw.save(emp);
    await this.repo.softRemove(emp);
  }

  /**
   * §1.4 / §15.2 — mask sensitive payroll attributes unless the caller's
   * roles include a PAYROLL_PII_ACCESS-equivalent grant. Returns a shallow
   * copy; the entity in memory is left untouched.
   */
  maskSensitive<T extends Employee | null>(
    employee: T,
    callerRoles: readonly string[],
  ): T {
    if (!employee) return employee;
    if (callerRoles.some((r) => PAYROLL_PII_ROLES.includes(r))) {
      return employee;
    }
    const copy = { ...employee } as Employee;
    for (const f of SENSITIVE_FIELDS) {
      if (copy[f] != null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (copy as any)[f] = '••••';
      }
    }
    return copy as T;
  }

  maskList(
    employees: Employee[],
    callerRoles: readonly string[],
  ): Employee[] {
    return employees.map((e) => this.maskSensitive(e, callerRoles));
  }
}
