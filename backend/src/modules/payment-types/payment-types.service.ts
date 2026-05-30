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
} from '../../common/dto/pagination.dto';
import { PaymentTypesQueryDto } from './dto/payment-types-query.dto';

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
      paymentCategoryId: dto.paymentCategoryId ?? null,
      makerRoleId: dto.makerRoleId ?? null,
      checkerRoleId: dto.checkerRoleId ?? null,
      makerUserId: dto.makerUserId ?? null,
      checkerUserId: dto.checkerUserId ?? null,
      isSystem: false,
      isActive: dto.isActive ?? true,
      version: 1,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(pt);
  }

  async findAll(
    query: PaymentTypesQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedResult<PaymentType>> {
    const { page = 1, limit = 50, search, mine, paymentCategoryId } = query;
    const qb = this.repo
      .createQueryBuilder('pt')
      .leftJoinAndSelect('pt.paymentCategory', 'paymentCategory')
      .leftJoinAndSelect('pt.makerRole', 'makerRole')
      .leftJoinAndSelect('pt.checkerRole', 'checkerRole')
      .leftJoinAndSelect('pt.makerUser', 'makerUser')
      .leftJoinAndSelect('pt.checkerUser', 'checkerUser')
      .orderBy('pt.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('(pt.name ILIKE :s OR pt.code ILIKE :s)', { s: `%${search}%` });
    }
    if (paymentCategoryId) {
      qb.andWhere('pt.payment_category_id = :cat', { cat: paymentCategoryId });
    }
    if (mine === 'true' && currentUserId) {
      // §1.2 / §3 - restrict to payment types where the current user is
      // the configured Maker - either by named user (maker_user_id) or
      // by holding the configured maker role.
      qb.andWhere(
        `(
           pt.maker_user_id = :uid
           OR (
             pt.maker_role_id IS NOT NULL
             AND pt.maker_role_id IN (
               SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = :uid
             )
           )
         )`,
        { uid: currentUserId },
      );
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<PaymentType> {
    const pt = await this.repo.findOne({
      where: { id },
      relations: ['paymentCategory', 'makerRole', 'checkerRole', 'makerUser', 'checkerUser'],
    });
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
