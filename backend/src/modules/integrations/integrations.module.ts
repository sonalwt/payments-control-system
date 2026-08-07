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

import { Bank } from '../banks/bank.entity';
import { Country } from '../countries/country.entity';

import { InvoiceWebhookController } from './invoice-webhook.controller';
import { InvoiceWebhookService } from './invoice-webhook.service';
import { InvoiceNameResolver } from './invoice-name-resolver.service';
import { CounterpartyProvisioner } from './counterparty-provisioner.service';

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
      Bank,
      Country,
    ]),
    PaymentRequestsModule,
    NotificationsModule,
  ],
  controllers: [InvoiceWebhookController],
  providers: [InvoiceWebhookService, InvoiceNameResolver, CounterpartyProvisioner],
  exports: [InvoiceWebhookService],
})
export class IntegrationsModule {}
