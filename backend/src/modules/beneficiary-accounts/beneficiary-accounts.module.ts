import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiaryAccount } from './beneficiary-account.entity';
import { BeneficiaryAccountChangeRequest } from './beneficiary-account-change-request.entity';
import { BeneficiaryAccountsController } from './beneficiary-accounts.controller';
import { BeneficiaryAccountsService } from './beneficiary-accounts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BeneficiaryAccount, BeneficiaryAccountChangeRequest]),
  ],
  controllers: [BeneficiaryAccountsController],
  providers: [BeneficiaryAccountsService],
  exports: [BeneficiaryAccountsService],
})
export class BeneficiaryAccountsModule {}
