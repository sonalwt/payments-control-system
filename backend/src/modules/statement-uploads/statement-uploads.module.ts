import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatementUpload } from './statement-upload.entity';
import { StatementUploadsService } from './statement-uploads.service';
import { StatementUploadsController } from './statement-uploads.controller';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';

@Module({
  imports: [TypeOrmModule.forFeature([StatementUpload]), BankAccountsModule],
  providers: [StatementUploadsService],
  controllers: [StatementUploadsController],
  exports: [StatementUploadsService],
})
export class StatementUploadsModule {}
