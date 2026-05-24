import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentType } from './payment-type.entity';

@Injectable()
export class PaymentTypeRepository {
  constructor(
    @InjectRepository(PaymentType)
    private readonly repo: Repository<PaymentType>,
  ) {}

  get raw(): Repository<PaymentType> {
    return this.repo;
  }

  create(data: Partial<PaymentType>): PaymentType {
    return this.repo.create(data);
  }

  save(entity: PaymentType): Promise<PaymentType> {
    return this.repo.save(entity);
  }

  findOneById(id: string): Promise<PaymentType | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<PaymentType | null> {
    return this.repo.findOne({ where: { code } });
  }

  async softRemove(entity: PaymentType): Promise<PaymentType> {
    return this.repo.softRemove(entity);
  }
}
