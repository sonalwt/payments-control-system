import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomingReceipt } from './incoming-receipt.entity';
import { IncomingReceiptDocument } from './incoming-receipt-document.entity';
import { IncomingReceiptsController } from './incoming-receipts.controller';
import { IncomingReceiptsService } from './incoming-receipts.service';
import { IncomingReceiptsRepository } from './incoming-receipts.repository';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncomingReceipt, IncomingReceiptDocument]),
    BankAccountsModule,
    NotificationsModule,
  ],
  controllers: [IncomingReceiptsController],
  providers: [IncomingReceiptsService, IncomingReceiptsRepository],
  exports: [IncomingReceiptsService],
})
export class IncomingReceiptsModule {}
