import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';

class TaxIdentifierDto {
  @ApiProperty({ enum: ['TRN', 'GSTIN', 'VAT', 'PAN', 'EIN', 'OTHER'] })
  @IsEnum(['TRN', 'GSTIN', 'VAT', 'PAN', 'EIN', 'OTHER'])
  type!: 'TRN' | 'GSTIN' | 'VAT' | 'PAN' | 'EIN' | 'OTHER';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  value!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 60)
  label?: string | null;
}

class AddressDto {
  @ApiProperty({ example: 'Registered office' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 60)
  label!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  line2?: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  state?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 20)
  postalCode?: string | null;

  @ApiProperty()
  @IsBoolean()
  isPrimary!: boolean;
}

export class CreateCounterpartyDto {
  @ApiProperty({ example: 'CP-0001' })
  @IsString()
  @Length(2, 40)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code may contain uppercase letters, digits, underscore or hyphen',
  })
  code!: string;

  @ApiProperty({ example: 'Acme Supplies Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ example: 'Acme Supplies Private Limited' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  legalName?: string;

  @ApiProperty({ enum: ['VENDOR', 'CUSTOMER', 'BOTH'] })
  @IsEnum(['VENDOR', 'CUSTOMER', 'BOTH'])
  role!: 'VENDOR' | 'CUSTOMER' | 'BOTH';

  /**
   * Trade vs non-trade nature. Required for self-service (non-admin) creation —
   * it drives the KYC routing (trade → KYC approval; non-trade → direct add,
   * flagged to KYC). Prefilled from the payment type's category in the UI.
   */
  @ApiPropertyOptional({ enum: ['TRADE', 'NON_TRADE'] })
  @IsOptional()
  @IsEnum(['TRADE', 'NON_TRADE'])
  paymentNature?: 'TRADE' | 'NON_TRADE';

  @ApiPropertyOptional({ description: 'Country master UUID' })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional({ type: [TaxIdentifierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxIdentifierDto)
  taxIdentifiers?: TaxIdentifierDto[];

  @ApiPropertyOptional({ type: [AddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 150)
  primaryContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  primaryContactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 50)
  primaryContactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false, description: 'KYC verification completed' })
  @IsOptional()
  @IsBoolean()
  kycDone?: boolean;
}
