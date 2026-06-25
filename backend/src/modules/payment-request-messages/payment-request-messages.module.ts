import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRequestMessage } from './payment-request-message.entity';
import { PaymentRequestMessagesService } from './payment-request-messages.service';
import { PaymentRequestMessagesController, PaymentRequestMessagesSummaryController } from './payment-request-messages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRequestMessage])],
  controllers: [PaymentRequestMessagesSummaryController, PaymentRequestMessagesController],
  providers: [PaymentRequestMessagesService],
})
export class PaymentRequestMessagesModule {}
