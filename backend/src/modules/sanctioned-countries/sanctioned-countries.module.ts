import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SanctionedCountry } from './sanctioned-country.entity';
import { SanctionedCountriesController } from './sanctioned-countries.controller';
import { SanctionedCountriesService } from './sanctioned-countries.service';
import { SanctionedCountryRepository } from './sanctioned-country.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([SanctionedCountry]), AuditLogsModule],
  controllers: [SanctionedCountriesController],
  providers: [SanctionedCountriesService, SanctionedCountryRepository],
  exports: [SanctionedCountriesService],
})
export class SanctionedCountriesModule {}
