import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FxRate } from './fx-rate.entity';
import { FxRatesController } from './fx-rates.controller';
import { FxRatesService } from './fx-rates.service';
import { OandaFxRateProvider } from './providers/oanda-fx-rate.provider';
import { FX_RATE_PROVIDER } from './providers/fx-rate-provider.interface';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [TypeOrmModule.forFeature([FxRate]), CurrenciesModule],
  controllers: [FxRatesController],
  providers: [
    FxRatesService,
    { provide: FX_RATE_PROVIDER, useClass: OandaFxRateProvider },
  ],
  exports: [FxRatesService],
})
export class FxRatesModule {}
