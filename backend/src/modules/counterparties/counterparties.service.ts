import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import {
  Address,
  Counterparty,
  CounterpartyRole,
} from './counterparty.entity';
import { CounterpartyRepository } from './counterparty.repository';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface CounterpartyQuery extends PaginationQueryDto {
  role?: CounterpartyRole;
  countryCode?: string;
  isActive?: 'true' | 'false';
}

@Injectable()
export class CounterpartiesService {
  constructor(private readonly repo: CounterpartyRepository) {}

  async create(
    dto: CreateCounterpartyDto,
    userId: string,
  ): Promise<Counterparty> {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Counterparty code "${dto.code}" already exists`,
      );
    }
    this.assertAddresses(dto.addresses ?? []);

    const entity = this.repo.create({
      code: dto.code,
      name: dto.name,
      legalName: dto.legalName ?? null,
      role: dto.role,
      countryCode: dto.countryCode,
      taxIdentifiers: dto.taxIdentifiers ?? [],
      addresses: dto.addresses ?? [],
      primaryContactName: dto.primaryContactName ?? null,
      primaryContactEmail: dto.primaryContactEmail ?? null,
      primaryContactPhone: dto.primaryContactPhone ?? null,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(
    query: CounterpartyQuery,
  ): Promise<PaginatedResult<Counterparty>> {
    const { page = 1, limit = 20, search, role, countryCode, isActive } = query;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (countryCode) where.countryCode = countryCode;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const baseWhere = search
      ? [
          { ...where, name: ILike(`%${search}%`) },
          { ...where, code: ILike(`%${search}%`) },
          { ...where, legalName: ILike(`%${search}%`) },
        ]
      : Object.keys(where).length > 0
        ? where
        : undefined;

    const [data, total] = await this.repo.raw.findAndCount({
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Counterparty> {
    const cp = await this.repo.findOneById(id);
    if (!cp) {
      throw new NotFoundException(`Counterparty ${id} not found`);
    }
    return cp;
  }

  async update(
    id: string,
    dto: UpdateCounterpartyDto,
    userId: string,
  ): Promise<Counterparty> {
    const cp = await this.findOne(id);
    if (dto.addresses) {
      this.assertAddresses(dto.addresses);
    }
    Object.assign(cp, dto, { updatedBy: userId });
    return this.repo.save(cp);
  }

  async remove(id: string, userId: string): Promise<void> {
    const cp = await this.findOne(id);
    cp.updatedBy = userId;
    await this.repo.raw.save(cp);
    await this.repo.softRemove(cp);
  }

  private assertAddresses(addresses: Address[]): void {
    if (addresses.length === 0) return;
    const primaryCount = addresses.filter((a) => a.isPrimary).length;
    if (primaryCount !== 1) {
      throw new BadRequestException(
        'Exactly one address must be marked primary.',
      );
    }
  }
}
