import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';

@Injectable()
export class GroupRepository {
  constructor(
    @InjectRepository(Group)
    private readonly repo: Repository<Group>,
  ) {}

  get raw(): Repository<Group> {
    return this.repo;
  }

  create(data: Partial<Group>): Group {
    return this.repo.create(data);
  }

  save(entity: Group): Promise<Group> {
    return this.repo.save(entity);
  }

  findOneById(id: string): Promise<Group | null> {
    return this.repo.findOne({ where: { id }, relations: ['legalEntities'] });
  }

  findByName(name: string): Promise<Group | null> {
    return this.repo.findOne({ where: { name } });
  }

  findByCode(code: string): Promise<Group | null> {
    return this.repo.findOne({ where: { code } });
  }

  async softRemove(entity: Group): Promise<Group> {
    return this.repo.softRemove(entity);
  }
}
