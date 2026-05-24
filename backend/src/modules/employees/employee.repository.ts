import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeeRepository {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  get raw(): Repository<Employee> {
    return this.repo;
  }

  create(data: Partial<Employee>): Employee {
    return this.repo.create(data);
  }

  save(entity: Employee): Promise<Employee> {
    return this.repo.save(entity);
  }

  findOneById(id: string): Promise<Employee | null> {
    return this.repo.findOne({
      where: { id },
      relations: { legalEntity: true, baseCurrency: true },
    });
  }

  findByCode(
    legalEntityId: string,
    employeeCode: string,
  ): Promise<Employee | null> {
    return this.repo.findOne({ where: { legalEntityId, employeeCode } });
  }

  softRemove(entity: Employee): Promise<Employee> {
    return this.repo.softRemove(entity);
  }
}
