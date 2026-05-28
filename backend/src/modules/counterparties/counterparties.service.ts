import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counterparty } from './counterparty.entity';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';
import { CounterpartyQueryDto } from './dto/counterparty-query.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CounterpartiesService {
  constructor(
    @InjectRepository(Counterparty)
    private readonly repo: Repository<Counterparty>,
  ) {}

  async create(dto: CreateCounterpartyDto, actorId: string): Promise<Counterparty> {
    if (await this.repo.findOne({ where: { code: dto.code } })) {
      throw new ConflictException(`Counterparty "${dto.code}" already exists`);
    }
    const cp = this.repo.create({
      code: dto.code,
      name: dto.name,
      legalName: dto.legalName ?? null,
      role: dto.role,
      countryId: dto.countryId ?? null,
      taxIdentifiers: dto.taxIdentifiers ?? [],
      addresses: dto.addresses ?? [],
      primaryContactName: dto.primaryContactName ?? null,
      primaryContactEmail: dto.primaryContactEmail ?? null,
      primaryContactPhone: dto.primaryContactPhone ?? null,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true,
      kycDone: dto.kycDone ?? false,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(cp);
  }

  async findAll(query: CounterpartyQueryDto): Promise<PaginatedResult<Counterparty>> {
    const { page = 1, limit = 20, search, role } = query;
    const qb = this.repo
      .createQueryBuilder('cp')
      .leftJoinAndSelect('cp.country', 'country')
      .orderBy('cp.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere(
        '(cp.name ILIKE :s OR cp.code ILIKE :s OR cp.legalName ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (role) {
      qb.andWhere('cp.role = :role', { role });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Counterparty> {
    const cp = await this.repo.findOne({ where: { id }, relations: ['country'] });
    if (!cp) throw new NotFoundException(`Counterparty ${id} not found`);
    return cp;
  }

  async update(id: string, dto: UpdateCounterpartyDto, actorId: string): Promise<Counterparty> {
    const cp = await this.findOne(id);
    if (dto.code && dto.code !== cp.code) {
      const dup = await this.repo.findOne({ where: { code: dto.code } });
      if (dup && dup.id !== id) {
        throw new ConflictException(`Counterparty "${dto.code}" already exists`);
      }
    }
    Object.assign(cp, dto, { updatedBy: actorId });
    return this.repo.save(cp);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const cp = await this.findOne(id);
    cp.updatedBy = actorId;
    await this.repo.save(cp);
    await this.repo.softRemove(cp);
  }
}
