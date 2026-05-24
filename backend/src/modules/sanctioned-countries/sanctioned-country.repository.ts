import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SanctionedCountry } from './sanctioned-country.entity';

@Injectable()
export class SanctionedCountryRepository {
  constructor(
    @InjectRepository(SanctionedCountry)
    private readonly repo: Repository<SanctionedCountry>,
  ) {}

  get raw(): Repository<SanctionedCountry> {
    return this.repo;
  }

  create(data: Partial<SanctionedCountry>): SanctionedCountry {
    return this.repo.create(data);
  }

  save(entity: SanctionedCountry): Promise<SanctionedCountry> {
    return this.repo.save(entity);
  }

  findOneById(id: string): Promise<SanctionedCountry | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCountryCode(countryCode: string): Promise<SanctionedCountry | null> {
    return this.repo.findOne({ where: { countryCode } });
  }

  softRemove(entity: SanctionedCountry): Promise<SanctionedCountry> {
    return this.repo.softRemove(entity);
  }
}
