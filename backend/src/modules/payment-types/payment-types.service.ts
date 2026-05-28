import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentType } from './payment-type.entity';
import { CreatePaymentTypeDto } from './dto/create-payment-type.dto';
import { UpdatePaymentTypeDto } from './dto/update-payment-type.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentTypesService {
  constructor(
    @InjectRepository(PaymentType)
    private readonly repo: Repository<PaymentType>,
  ) {}

  async create(dto: CreatePaymentTypeDto, actorId: string): Promise<PaymentType> {
    if (await this.repo.findOne({ where: { code: dto.code } })) {
      throw new ConflictException(`Payment type "${dto.code}" already exists`);
    }
    const pt = this.repo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      direction: dto.direction,
      requiresApprovalChain: dto.requiresApprovalChain ?? true,
      isBatchBased: dto.isBatchBased ?? false,
      isConfidential: dto.isConfidential ?? false,
      mobileInitiationOnly: dto.mobileInitiationOnly ?? false,
      allowsCrossCurrency: dto.allowsCrossCurrency ?? true,
      documentPolicy: dto.documentPolicy ?? [],
      fieldConfig: dto.fieldConfig ?? [],
      isSystem: false,
      isActive: dto.isActive ?? true,
      version: 1,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(pt);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<PaymentType>> {
    const { page = 1, limit = 50, search } = query;
    const qb = this.repo
      .createQueryBuilder('pt')
      .orderBy('pt.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('(pt.name ILIKE :s OR pt.code ILIKE :s)', { s: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<PaymentType> {
    const pt = await this.repo.findOne({ where: { id } });
    if (!pt) throw new NotFoundException(`Payment type ${id} not found`);
    return pt;
  }

  async update(id: string, dto: UpdatePaymentTypeDto, actorId: string): Promise<PaymentType> {
    const pt = await this.findOne(id);
    if (pt.isSystem && dto.code && dto.code !== pt.code) {
      throw new BadRequestException('Cannot change the code of a system payment type');
    }
    if (dto.code && dto.code !== pt.code) {
      const dup = await this.repo.findOne({ where: { code: dto.code } });
      if (dup && dup.id !== id) {
        throw new ConflictException(`Payment type "${dto.code}" already exists`);
      }
    }
    Object.assign(pt, dto, { updatedBy: actorId });
    return this.repo.save(pt);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const pt = await this.findOne(id);
    if (pt.isSystem) {
      throw new BadRequestException(
        'System payment types cannot be deleted. Deactivate it instead.',
      );
    }
    pt.updatedBy = actorId;
    await this.repo.save(pt);
    await this.repo.softRemove(pt);
  }
}
