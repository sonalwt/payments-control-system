import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './country.entity';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { BusinessUnit } from '../business-units/business-unit.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Country, LegalEntity, BusinessUnit]),
    AuditLogsModule,
  ],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}
