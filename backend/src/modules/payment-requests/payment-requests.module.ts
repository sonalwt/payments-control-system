import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRequest } from './payment-request.entity';
import { PaymentRequestApproval } from './payment-request-approval.entity';
import { PaymentRequestDocument } from './payment-request-document.entity';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';
import { BeneficiaryAccountsModule } from '../beneficiary-accounts/beneficiary-accounts.module';
import { ApprovalMatricesModule } from '../approval-matrices/approval-matrices.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentRequest,
      PaymentRequestApproval,
      PaymentRequestDocument,
    ]),
    BeneficiaryAccountsModule,
    ApprovalMatricesModule,
    UploadsModule,
  ],
  controllers: [PaymentRequestsController],
  providers: [PaymentRequestsService],
  exports: [PaymentRequestsService, TypeOrmModule],
})
export class PaymentRequestsModule {}
