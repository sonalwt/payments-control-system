import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalEntity } from './legal-entity.entity';
import { LegalEntitiesService } from './legal-entities.service';
import { LegalEntitiesController } from './legal-entities.controller';
import { Group } from '../groups/group.entity';
import { Currency } from '../currencies/currency.entity';
import { Country } from '../countries/country.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegalEntity, Group, Currency, Country]),
    AuditLogsModule,
  ],
  controllers: [LegalEntitiesController],
  providers: [LegalEntitiesService],
  exports: [LegalEntitiesService, TypeOrmModule],
})
export class LegalEntitiesModule {}
