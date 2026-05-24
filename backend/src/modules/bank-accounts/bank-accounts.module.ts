import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from './bank-account.entity';
import { BalanceChange } from './balance-change.entity';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountsRepository } from './bank-accounts.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankAccount, BalanceChange]),
    AuditLogsModule,
  ],
  controllers: [BankAccountsController],
  providers: [BankAccountsService, BankAccountsRepository],
  exports: [BankAccountsService, TypeOrmModule],
})
export class BankAccountsModule {}
