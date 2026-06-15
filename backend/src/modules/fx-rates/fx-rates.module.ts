import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FxRate } from './fx-rate.entity';
import { FxRatesController } from './fx-rates.controller';
import { FxRatesService } from './fx-rates.service';
import { OandaRatesProvider } from './providers/oanda-rates.provider';
import { RATES_PROVIDER } from './providers/rates-provider.interface';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [TypeOrmModule.forFeature([FxRate]), CurrenciesModule],
  controllers: [FxRatesController],
  providers: [
    FxRatesService,
    // Default rates provider (§2.2). Swap this binding to substitute the feed.
    { provide: RATES_PROVIDER, useClass: OandaRatesProvider },
  ],
  exports: [FxRatesService],
})
export class FxRatesModule {}
