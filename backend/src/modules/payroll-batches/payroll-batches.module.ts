import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollBatch } from './payroll-batch.entity';
import { PayrollBatchItem } from './payroll-batch-item.entity';
import { PayrollBatchesController } from './payroll-batches.controller';
import { PayrollBatchesService } from './payroll-batches.service';
import { PaymentRequestsModule } from '../payment-requests/payment-requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollBatch, PayrollBatchItem]),
    PaymentRequestsModule,
  ],
  controllers: [PayrollBatchesController],
  providers: [PayrollBatchesService],
  exports: [PayrollBatchesService],
})
export class PayrollBatchesModule {}
