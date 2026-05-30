import { PartialType } from '@nestjs/swagger';
import { CreatePaymentCategoryDto } from './create-payment-category.dto';

export class UpdatePaymentCategoryDto extends PartialType(CreatePaymentCategoryDto) {}
