import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalEntity } from './legal-entity.entity';
import { Country } from '../countries/country.entity';
import { LegalEntitiesController } from './legal-entities.controller';
import { LegalEntitiesService } from './legal-entities.service';

@Module({
  imports: [TypeOrmModule.forFeature([LegalEntity, Country])],
  controllers: [LegalEntitiesController],
  providers: [LegalEntitiesService],
  exports: [LegalEntitiesService, TypeOrmModule],
})
export class LegalEntitiesModule {}
