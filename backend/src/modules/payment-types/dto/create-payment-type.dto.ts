import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

class DocumentPolicyItemDto {
  @ApiProperty({ example: 'INVOICE' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Invoice PDF' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  amountThresholdMinor?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currencyCode?: string | null;
}

class FieldConfigItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty()
  @IsBoolean()
  visible!: boolean;

  @ApiProperty()
  @IsBoolean()
  required!: boolean;

  @ApiProperty()
  @IsBoolean()
  readOnly!: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  helpText?: string | null;
}

export class CreatePaymentTypeDto {
  @ApiProperty({ example: 'VENDOR_PAYMENT' })
  @IsString()
  @Length(2, 40)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be UPPER_SNAKE_CASE',
  })
  code!: string;

  @ApiProperty({ example: 'Vendor Payment' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['OUTGOING', 'INCOMING'] })
  @IsEnum(['OUTGOING', 'INCOMING'])
  direction!: 'OUTGOING' | 'INCOMING';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresApprovalChain?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBatchBased?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isConfidential?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  mobileInitiationOnly?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowsCrossCurrency?: boolean;

  @ApiPropertyOptional({ type: [DocumentPolicyItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentPolicyItemDto)
  documentPolicy?: DocumentPolicyItemDto[];

  @ApiPropertyOptional({ type: [FieldConfigItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldConfigItemDto)
  fieldConfig?: FieldConfigItemDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
