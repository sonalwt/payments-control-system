import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bank } from './bank.entity';
import { BanksController } from './banks.controller';
import { CounterpartyBanksController } from './counterparty-banks.controller';
import { BanksService } from './banks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bank])],
  controllers: [BanksController, CounterpartyBanksController],
  providers: [BanksService],
  exports: [BanksService, TypeOrmModule],
})
export class BanksModule {}
