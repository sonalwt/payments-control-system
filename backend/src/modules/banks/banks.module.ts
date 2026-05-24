import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bank } from './bank.entity';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';
import { BanksRepository } from './banks.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bank]), AuditLogsModule],
  controllers: [BanksController],
  providers: [BanksService, BanksRepository],
  exports: [BanksService, TypeOrmModule],
})
export class BanksModule {}
