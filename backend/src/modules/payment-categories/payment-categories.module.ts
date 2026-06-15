import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentCategory } from './payment-category.entity';
import { PaymentCategoriesController } from './payment-categories.controller';
import { PaymentCategoriesService } from './payment-categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentCategory])],
  controllers: [PaymentCategoriesController],
  providers: [PaymentCategoriesService],
  exports: [PaymentCategoriesService, TypeOrmModule],
})
export class PaymentCategoriesModule {}
