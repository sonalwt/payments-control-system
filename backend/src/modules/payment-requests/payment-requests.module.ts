import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRequest } from './payment-request.entity';
import { PaymentRequestApproval } from './payment-request-approval.entity';
import { PaymentRequestDocument } from './payment-request-document.entity';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';
import { PaymentRequestsRepository } from './payment-requests.repository';
import { ApprovalMatricesModule } from '../approval-matrices/approval-matrices.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentRequest,
      PaymentRequestApproval,
      PaymentRequestDocument,
    ]),
    ApprovalMatricesModule,
    BankAccountsModule,
  ],
  controllers: [PaymentRequestsController],
  providers: [PaymentRequestsService, PaymentRequestsRepository],
  exports: [PaymentRequestsService],
})
export class PaymentRequestsModule {}
