import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './currency.entity';

@Injectable()
export class CurrenciesRepository {
  constructor(
    @InjectRepository(Currency) private readonly repo: Repository<Currency>,
  ) {}

  get raw(): Repository<Currency> {
    return this.repo;
  }

  create(data: Partial<Currency>): Currency {
    return this.repo.create(data);
  }

  save(entity: Currency): Promise<Currency> {
    return this.repo.save(entity);
  }

  findOneById(id: string): Promise<Currency | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<Currency | null> {
    return this.repo.findOne({ where: { code: code.toUpperCase() } });
  }

  softRemove(entity: Currency): Promise<Currency> {
    return this.repo.softRemove(entity);
  }
}
