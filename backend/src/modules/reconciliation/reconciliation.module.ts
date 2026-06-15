import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatementUpload } from './statement-upload.entity';
import { StatementLine } from './statement-line.entity';
import { ReconciliationException } from './reconciliation-exception.entity';
import { StatementUploadsService } from './statement-uploads.service';
import { ReconciliationService } from './reconciliation.service';
import { StatementUploadsController } from './statement-uploads.controller';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationExceptionsController } from './reconciliation-exceptions.controller';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { PaymentRequest } from '../payment-requests/payment-request.entity';
import { IncomingReceipt } from '../incoming-receipts/incoming-receipt.entity';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StatementUpload,
      StatementLine,
      ReconciliationException,
      BankAccount,
      PaymentRequest,
      IncomingReceipt,
    ]),
    UploadsModule,
  ],
  controllers: [
    StatementUploadsController,
    ReconciliationController,
    ReconciliationExceptionsController,
  ],
  providers: [StatementUploadsService, ReconciliationService],
  exports: [StatementUploadsService, ReconciliationService],
})
export class ReconciliationModule {}
