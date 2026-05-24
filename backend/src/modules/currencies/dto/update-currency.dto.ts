import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCurrencyDto } from './create-currency.dto';

// `code` is the natural key and is immutable once created.
export class UpdateCurrencyDto extends PartialType(
  OmitType(CreateCurrencyDto, ['code'] as const),
) {}
