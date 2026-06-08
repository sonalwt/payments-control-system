import { Module } from '@nestjs/common';
import { EmployeePortalController } from './employee-portal.controller';
import { PaymentRequestsModule } from '../payment-requests/payment-requests.module';
import { PaymentTypesModule } from '../payment-types/payment-types.module';
import { BeneficiaryAccountsModule } from '../beneficiary-accounts/beneficiary-accounts.module';
import { EmployeeAuthModule } from '../employee-auth/employee-auth.module';
import { UploadsModule } from '../uploads/uploads.module';

/**
 * Employee self-service portal. Reuses the existing payment-request engine
 * and master services; only the entry point (controller) and auth realm are
 * portal-specific. EmployeeAuthModule registers the 'employee-jwt' strategy
 * the @EmployeeAuth() guard relies on.
 */
@Module({
  imports: [
    EmployeeAuthModule,
    PaymentRequestsModule,
    PaymentTypesModule,
    BeneficiaryAccountsModule,
    UploadsModule,
  ],
  controllers: [EmployeePortalController],
})
export class EmployeePortalModule {}
