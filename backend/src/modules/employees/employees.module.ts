import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeeRepository } from './employee.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee]), AuditLogsModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeRepository],
  exports: [EmployeesService],
})
export class EmployeesModule {}
