import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeBankAccountChange } from './employee-bank-account-change.entity';
import { EmployeeBankAccountChangesController } from './employee-bank-account-changes.controller';
import { EmployeeBankAccountChangesService } from './employee-bank-account-changes.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeBankAccountChange])],
  controllers: [EmployeeBankAccountChangesController],
  providers: [EmployeeBankAccountChangesService],
  exports: [EmployeeBankAccountChangesService],
})
export class EmployeeBankAccountChangesModule {}
