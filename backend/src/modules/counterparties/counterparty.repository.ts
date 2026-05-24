import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counterparty } from './counterparty.entity';

@Injectable()
export class CounterpartyRepository {
  constructor(
    @InjectRepository(Counterparty)
    private readonly repo: Repository<Counterparty>,
  ) {}

  get raw(): Repository<Counterparty> {
    return this.repo;
  }

  create(data: Partial<Counterparty>): Counterparty {
    return this.repo.create(data);
  }

  save(entity: Counterparty): Promise<Counterparty> {
    return this.repo.save(entity);
  }

  findOneById(id: string): Promise<Counterparty | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<Counterparty | null> {
    return this.repo.findOne({ where: { code } });
  }

  softRemove(entity: Counterparty): Promise<Counterparty> {
    return this.repo.softRemove(entity);
  }
}
