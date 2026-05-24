import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bank } from './bank.entity';

@Injectable()
export class BanksRepository {
  constructor(@InjectRepository(Bank) private readonly repo: Repository<Bank>) {}

  get raw(): Repository<Bank> {
    return this.repo;
  }

  create(data: Partial<Bank>): Bank {
    return this.repo.create(data);
  }

  save(entity: Bank): Promise<Bank> {
    return this.repo.save(entity);
  }

  findOneById(id: string): Promise<Bank | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByNameAndCountry(
    name: string,
    countryCode: string,
  ): Promise<Bank | null> {
    return this.repo.findOne({
      where: { name, countryCode: countryCode.toUpperCase() },
    });
  }

  softRemove(entity: Bank): Promise<Bank> {
    return this.repo.softRemove(entity);
  }
}
