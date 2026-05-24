import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateSanctionedCountryDto {
  @ApiProperty({ example: 'IR', description: 'ISO 3166-1 alpha-2' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be an ISO 3166-1 alpha-2 code' })
  countryCode!: string;

  @ApiProperty({ example: 'Iran, Islamic Republic of' })
  @IsString()
  @Length(2, 120)
  countryName!: string;

  @ApiProperty({
    example: 'OFAC comprehensive sanctions; UN Security Council resolutions.',
    description: 'Justification for adding the country to the list (audited).',
  })
  @IsString()
  @Length(3, 2000)
  reason!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
