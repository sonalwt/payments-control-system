import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentRequestDto } from './create-payment-request.dto';

/** Only DRAFT requests can be updated. */
export class UpdatePaymentRequestDto extends PartialType(CreatePaymentRequestDto) {}
