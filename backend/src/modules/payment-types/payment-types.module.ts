import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentType } from './payment-type.entity';
import { PaymentTypesController } from './payment-types.controller';
import { PaymentTypesService } from './payment-types.service';
import { PaymentTypeRepository } from './payment-type.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentType]), AuditLogsModule],
  controllers: [PaymentTypesController],
  providers: [PaymentTypesService, PaymentTypeRepository],
  exports: [PaymentTypesService],
})
export class PaymentTypesModule {}
