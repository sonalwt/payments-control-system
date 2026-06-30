import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { Country } from '../countries/country.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { ImportResult, parseImportFile } from '../../common/helpers/parse-import-file';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee) private readonly repo: Repository<Employee>,
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
    @InjectRepository(LegalEntity)
    private readonly legalEntityRepo: Repository<LegalEntity>,
  ) {}

  /**
   * Resolve the country of employment for an employee. The form now selects a
   * legal entity rather than a country, so the country is derived from the
   * chosen legal entity. CSV import still passes an explicit country.
   */
  private async resolveCountryId(dto: {
    legalEntityId?: string;
    countryOfEmploymentId?: string;
  }): Promise<string> {
    if (dto.legalEntityId) {
      const le = await this.legalEntityRepo.findOne({
        where: { id: dto.legalEntityId },
      });
      if (!le) throw new BadRequestException('Selected legal entity was not found.');
      if (!le.countryId) {
        throw new BadRequestException(
          'The selected legal entity has no country set; set its country first.',
        );
      }
      return le.countryId;
    }
    if (dto.countryOfEmploymentId) return dto.countryOfEmploymentId;
    throw new BadRequestException('A legal entity is required.');
  }

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
    const countryOfEmploymentId = await this.resolveCountryId(dto);
    const emp = this.repo.create({
      employeeCode: dto.employeeCode,
      fullName: dto.fullName,
      workEmail: dto.workEmail,
      legalEntityId: dto.legalEntityId ?? null,
      countryOfEmploymentId,
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
      .leftJoinAndSelect('e.legalEntity', 'legalEntity')
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
      relations: ['countryOfEmployment', 'legalEntity'],
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
    // Keep the country of employment in sync with the (possibly changed) legal entity.
    if (dto.legalEntityId) {
      emp.countryOfEmploymentId = await this.resolveCountryId({
        legalEntityId: dto.legalEntityId,
      });
    }
    return this.repo.save(emp);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const emp = await this.findOne(id);
    emp.updatedBy = actorId;
    await this.repo.save(emp);
    await this.repo.softRemove(emp);
  }

  async bulkImport(file: Express.Multer.File, actorId: string): Promise<ImportResult> {
    const rows = parseImportFile(file);
    const countries = await this.countryRepo.find({ select: ['id', 'code'] });
    const countryMap = new Map(countries.map((c) => [c.code.toUpperCase(), c.id]));
    const legalEntities = await this.legalEntityRepo.find({ select: ['id', 'code'] });
    const legalEntityMap = new Map(legalEntities.map((le) => [le.code.toUpperCase(), le.id]));
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const employeeCode = row['employee_code'], fullName = row['full_name'], workEmail = row['work_email'];
      if (!employeeCode) { result.errors.push({ row: i + 2, message: 'employee_code is required' }); result.skipped++; continue; }
      if (!fullName) { result.errors.push({ row: i + 2, message: 'full_name is required' }); result.skipped++; continue; }
      if (!workEmail) { result.errors.push({ row: i + 2, message: 'work_email is required' }); result.skipped++; continue; }
      // Prefer the legal entity (country of employment is derived from it).
      // country_code is still accepted as a fallback for older templates.
      const legalEntityCode = (row['legal_entity_code'] ?? '').toUpperCase();
      const countryCode = (row['country_code'] ?? '').toUpperCase();
      let legalEntityId: string | undefined;
      let countryOfEmploymentId: string | undefined;
      if (legalEntityCode) {
        legalEntityId = legalEntityMap.get(legalEntityCode);
        if (!legalEntityId) { result.errors.push({ row: i + 2, message: `Legal entity code "${legalEntityCode}" not found` }); result.skipped++; continue; }
      } else if (countryCode) {
        countryOfEmploymentId = countryMap.get(countryCode);
        if (!countryOfEmploymentId) { result.errors.push({ row: i + 2, message: `Country code "${countryCode}" not found` }); result.skipped++; continue; }
      } else {
        result.errors.push({ row: i + 2, message: 'legal_entity_code is required' }); result.skipped++; continue;
      }
      try {
        await this.create({
          employeeCode, fullName, workEmail, legalEntityId, countryOfEmploymentId,
          startDate: row['start_date'] || undefined, endDate: row['end_date'] || undefined,
          nationalId: row['national_id'] || undefined, taxIdentifier: row['tax_identifier'] || undefined,
          dateOfBirth: row['date_of_birth'] || undefined, mobileNumber: row['mobile_number'] || undefined,
          address: row['address'] || undefined, compensationBand: row['compensation_band'] || undefined,
          isActive: row['is_active'] !== 'false',
        }, actorId);
        result.created++;
      } catch (e: unknown) {
        result.errors.push({ row: i + 2, message: e instanceof Error ? e.message : 'Unknown error' });
        result.skipped++;
      }
    }
    return result;
  }
}
