import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  countryName!: string;

  @ApiProperty({ example: 'IND' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  countryShortName!: string;

  @ApiProperty({ example: 'IN', description: 'Country code (ISO 3166-1 alpha-2 or alpha-3)' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code!: string;

  @ApiProperty({ description: 'Currency master UUID' })
  @IsUUID()
  currencyId!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Sanctioned country (SoW §1.6 / §6.5)' })
  @IsOptional()
  @IsBoolean()
  isSanctioned?: boolean;
}
