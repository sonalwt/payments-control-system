import { PartialType } from '@nestjs/swagger';
import { CreatePaymentRequestDto } from './create-payment-request.dto';

/** Allowed only while the request is in DRAFT. */
export class UpdatePaymentRequestDto extends PartialType(CreatePaymentRequestDto) {}
