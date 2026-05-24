import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CounterpartyRole } from '../counterparty.entity';
import { TaxIdentifierDto } from './tax-identifier.dto';
import { AddressDto } from './address.dto';

export class CreateCounterpartyDto {
  @ApiProperty({ example: 'ACME_LTD' })
  @IsString()
  @Length(2, 40)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code must be uppercase alphanumeric (with _ or -)',
  })
  code!: string;

  @ApiProperty({ example: 'Acme Ltd' })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ example: 'Acme Trading Private Limited' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  legalName?: string | null;

  @ApiProperty({ enum: CounterpartyRole })
  @IsEnum(CounterpartyRole)
  role!: CounterpartyRole;

  @ApiProperty({ example: 'SG', description: 'ISO 3166-1 alpha-2' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  countryCode!: string;

  @ApiPropertyOptional({ type: [TaxIdentifierDto], default: [] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TaxIdentifierDto)
  taxIdentifiers?: TaxIdentifierDto[];

  @ApiPropertyOptional({ type: [AddressDto], default: [] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 150)
  primaryContactName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Length(0, 150)
  primaryContactEmail?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 50)
  primaryContactPhone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
