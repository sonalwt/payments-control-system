import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

// Removal requires a reason per §1.6: every change is logged with user,
// timestamp, and reason. Carried in the request body on DELETE.
export class RemoveSanctionedCountryDto {
  @ApiProperty({
    example: 'Removed from OFAC SDN list on 2026-05-20.',
    description: 'Justification for removing the country from the list (audited).',
  })
  @IsString()
  @Length(3, 2000)
  reason!: string;
}
