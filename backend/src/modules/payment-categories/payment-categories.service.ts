import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentCategory } from './payment-category.entity';
import { CreatePaymentCategoryDto } from './dto/create-payment-category.dto';
import { UpdatePaymentCategoryDto } from './dto/update-payment-category.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentCategoriesService {
  constructor(
    @InjectRepository(PaymentCategory)
    private readonly repo: Repository<PaymentCategory>,
  ) {}

  async create(dto: CreatePaymentCategoryDto, actorId: string): Promise<PaymentCategory> {
    if (await this.repo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException(`Payment category "${dto.name}" already exists`);
    }
    const pc = this.repo.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(pc);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<PaymentCategory>> {
    const { page = 1, limit = 50, search } = query;
    const qb = this.repo
      .createQueryBuilder('pc')
      .orderBy('pc.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('pc.name ILIKE :s', { s: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<PaymentCategory> {
    const pc = await this.repo.findOne({ where: { id } });
    if (!pc) throw new NotFoundException(`Payment category ${id} not found`);
    return pc;
  }

  async update(id: string, dto: UpdatePaymentCategoryDto, actorId: string): Promise<PaymentCategory> {
    const pc = await this.findOne(id);
    if (dto.name && dto.name !== pc.name) {
      const dup = await this.repo.findOne({ where: { name: dto.name } });
      if (dup && dup.id !== id) {
        throw new ConflictException(`Payment category "${dto.name}" already exists`);
      }
    }
    Object.assign(pc, dto, { updatedBy: actorId });
    return this.repo.save(pc);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const pc = await this.findOne(id);
    pc.updatedBy = actorId;
    await this.repo.save(pc);
    await this.repo.softRemove(pc);
  }
}
