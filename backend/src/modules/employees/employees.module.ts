import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { Country } from '../countries/country.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Country])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService, TypeOrmModule],
})
export class EmployeesModule {}
