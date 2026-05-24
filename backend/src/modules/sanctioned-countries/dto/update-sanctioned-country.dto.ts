import { OmitType, PartialType } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { CreateSanctionedCountryDto } from './create-sanctioned-country.dto';

// `countryCode` is the natural key and cannot be changed once created.
// `reason` is mandatory on every update so the audit trail captures why.
export class UpdateSanctionedCountryDto extends PartialType(
  OmitType(CreateSanctionedCountryDto, ['countryCode', 'reason'] as const),
) {
  @IsString()
  @Length(3, 2000)
  reason!: string;
}
