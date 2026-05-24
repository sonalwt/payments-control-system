import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FxRate } from './fx-rate.entity';
import { FxRatesController } from './fx-rates.controller';
import { FxRatesService } from './fx-rates.service';
import { FxRatesRepository } from './fx-rates.repository';
import { OandaRatesProvider } from './providers/oanda-rates.provider';
import { RATES_PROVIDER } from './providers/rates-provider.interface';
import { CurrenciesModule } from '../currencies/currencies.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([FxRate]), CurrenciesModule, AuditLogsModule],
  controllers: [FxRatesController],
  providers: [
    FxRatesService,
    FxRatesRepository,
    OandaRatesProvider,
    { provide: RATES_PROVIDER, useExisting: OandaRatesProvider },
  ],
  exports: [FxRatesService],
})
export class FxRatesModule {}
