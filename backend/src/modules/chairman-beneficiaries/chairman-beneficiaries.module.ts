import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChairmanBeneficiary } from './chairman-beneficiary.entity';
import { ChairmanBeneficiaryChangeRequest } from './chairman-beneficiary-change-request.entity';
import { ChairmanBeneficiariesController } from './chairman-beneficiaries.controller';
import { ChairmanBeneficiariesService } from './chairman-beneficiaries.service';
import { ChairmanBeneficiaryCoolingOffCron } from './chairman-beneficiary-cooling-off.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChairmanBeneficiary, ChairmanBeneficiaryChangeRequest]),
  ],
  controllers: [ChairmanBeneficiariesController],
  providers: [ChairmanBeneficiariesService, ChairmanBeneficiaryCoolingOffCron],
  exports: [ChairmanBeneficiariesService],
})
export class ChairmanBeneficiariesModule {}
