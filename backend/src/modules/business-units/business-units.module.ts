import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessUnit } from './business-unit.entity';
import { BusinessUnitsController } from './business-units.controller';
import { BusinessUnitsService } from './business-units.service';
import { Country } from '../countries/country.entity';
import { Department } from '../departments/department.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessUnit, Country, Department]),
    AuditLogsModule,
  ],
  controllers: [BusinessUnitsController],
  providers: [BusinessUnitsService],
  exports: [BusinessUnitsService],
})
export class BusinessUnitsModule {}
