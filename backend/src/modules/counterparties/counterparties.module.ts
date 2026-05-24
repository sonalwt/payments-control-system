import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Counterparty } from './counterparty.entity';
import { CounterpartiesController } from './counterparties.controller';
import { CounterpartiesService } from './counterparties.service';
import { CounterpartyRepository } from './counterparty.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Counterparty]), AuditLogsModule],
  controllers: [CounterpartiesController],
  providers: [CounterpartiesService, CounterpartyRepository],
  exports: [CounterpartiesService],
})
export class CounterpartiesModule {}
