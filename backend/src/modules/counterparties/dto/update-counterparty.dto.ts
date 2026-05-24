import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCounterpartyDto } from './create-counterparty.dto';

export class UpdateCounterpartyDto extends PartialType(
  OmitType(CreateCounterpartyDto, ['code'] as const),
) {}
