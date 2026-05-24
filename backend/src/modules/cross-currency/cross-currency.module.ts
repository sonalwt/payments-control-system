import { Module } from '@nestjs/common';
import { CrossCurrencyService } from './cross-currency.service';
import { CrossCurrencyController } from './cross-currency.controller';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { FxRatesModule } from '../fx-rates/fx-rates.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [BankAccountsModule, FxRatesModule, AuditLogsModule],
  controllers: [CrossCurrencyController],
  providers: [CrossCurrencyService],
  exports: [CrossCurrencyService],
})
export class CrossCurrencyModule {}
