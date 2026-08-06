import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentRequest } from '../payment-requests/payment-request.entity';
import { PaymentRequestsModule } from '../payment-requests/payment-requests.module';
import { PaymentType } from '../payment-types/payment-type.entity';
import { Currency } from '../currencies/currency.entity';
import { Counterparty } from '../counterparties/counterparty.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { BeneficiaryAccount } from '../beneficiary-accounts/beneficiary-account.entity';
import { User } from '../users/user.entity';
import { Notification } from '../notifications/notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';

import { InvoiceWebhookController } from './invoice-webhook.controller';
import { InvoiceWebhookService } from './invoice-webhook.service';
import { InvoiceNameResolver } from './invoice-name-resolver.service';

/** Inbound integrations with upstream systems (currently: the invoicing app). */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentRequest,
      PaymentType,
      Currency,
      Counterparty,
      LegalEntity,
      BeneficiaryAccount,
      User,
      Notification,
    ]),
    PaymentRequestsModule,
    NotificationsModule,
  ],
  controllers: [InvoiceWebhookController],
  providers: [InvoiceWebhookService, InvoiceNameResolver],
  exports: [InvoiceWebhookService],
})
export class IntegrationsModule {}
