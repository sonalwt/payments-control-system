import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './country.entity';
import { Currency } from '../currencies/currency.entity';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Country, Currency])],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService, TypeOrmModule],
})
export class CountriesModule {}
