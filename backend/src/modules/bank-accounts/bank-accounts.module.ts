import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from './bank-account.entity';
import { BankAccountChargeBand } from './bank-account-charge-band.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { BankAccountsController } from './bank-accounts.controller';
import { CounterpartyBankAccountsController } from './counterparty-bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount, BankAccountChargeBand, LegalEntity])],
  controllers: [BankAccountsController, CounterpartyBankAccountsController],
  providers: [BankAccountsService],
  exports: [BankAccountsService, TypeOrmModule],
})
export class BankAccountsModule {}
