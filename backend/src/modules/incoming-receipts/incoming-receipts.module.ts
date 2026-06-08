import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomingReceipt } from './incoming-receipt.entity';
import { IncomingReceiptDocument } from './incoming-receipt-document.entity';
import { IncomingReceiptsController } from './incoming-receipts.controller';
import { IncomingReceiptsService } from './incoming-receipts.service';
import { User } from '../users/user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncomingReceipt, IncomingReceiptDocument, User]),
    MailModule,
  ],
  controllers: [IncomingReceiptsController],
  providers: [IncomingReceiptsService],
  exports: [IncomingReceiptsService, TypeOrmModule],
})
export class IncomingReceiptsModule {}
