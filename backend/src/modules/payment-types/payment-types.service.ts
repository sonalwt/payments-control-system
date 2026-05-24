import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { PaymentType, PaymentDirection } from './payment-type.entity';
import { PaymentTypeRepository } from './payment-type.repository';
import { CreatePaymentTypeDto } from './dto/create-payment-type.dto';
import { UpdatePaymentTypeDto } from './dto/update-payment-type.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentTypesService {
  constructor(private readonly repo: PaymentTypeRepository) {}

  async create(dto: CreatePaymentTypeDto, userId: string): Promise<PaymentType> {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Payment type code "${dto.code}" already exists`);
    }
    this.assertConfidentialityRules(dto);

    const entity = this.repo.create({
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
      fieldConfig: this.sortFields(dto.fieldConfig ?? []),
      isSystem: false,
      isActive: dto.isActive ?? true,
      version: 1,
      effectiveFrom: dto.effectiveFrom ?? new Date().toISOString().slice(0, 10),
      effectiveTo: dto.effectiveTo ?? null,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.repo.save(entity);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<PaymentType>> {
    const { page = 1, limit = 20, search } = query;
    const [data, total] = await this.repo.raw.findAndCount({
      where: search
        ? [{ name: ILike(`%${search}%`) }, { code: ILike(`%${search}%`) }]
        : undefined,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<PaymentType> {
    const pt = await this.repo.findOneById(id);
    if (!pt) {
      throw new NotFoundException(`Payment type ${id} not found`);
    }
    return pt;
  }

  async update(
    id: string,
    dto: UpdatePaymentTypeDto,
    userId: string,
  ): Promise<PaymentType> {
    const pt = await this.findOne(id);

    // Merge into a candidate to validate cross-field rules
    const candidate: Partial<PaymentType> = { ...pt, ...dto } as Partial<PaymentType>;
    this.assertConfidentialityRules({
      isConfidential: candidate.isConfidential ?? pt.isConfidential,
      requiresApprovalChain:
        candidate.requiresApprovalChain ?? pt.requiresApprovalChain,
      direction: candidate.direction ?? pt.direction,
    });

    Object.assign(pt, {
      ...dto,
      fieldConfig: dto.fieldConfig
        ? this.sortFields(dto.fieldConfig)
        : pt.fieldConfig,
      updatedBy: userId,
    });
    return this.repo.save(pt);
  }

  async remove(id: string, userId: string): Promise<void> {
    const pt = await this.findOne(id);
    if (pt.isSystem) {
      throw new BadRequestException(
        'System payment types cannot be deleted; deactivate it instead.',
      );
    }
    pt.updatedBy = userId;
    await this.repo.raw.save(pt);
    await this.repo.softRemove(pt);
  }

  private assertConfidentialityRules(input: {
    isConfidential?: boolean;
    requiresApprovalChain?: boolean;
    direction: PaymentDirection;
  }): void {
    if (input.isConfidential && input.requiresApprovalChain) {
      throw new BadRequestException(
        'Confidential payment types cannot require a standard approval chain (see SOW §9.1).',
      );
    }
  }

  private sortFields<T extends { sortOrder: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
