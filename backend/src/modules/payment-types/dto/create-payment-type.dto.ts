import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PaymentDirection } from '../payment-type.entity';
import { DocumentPolicyItemDto } from './document-policy-item.dto';
import { FieldConfigItemDto } from './field-config-item.dto';

export class CreatePaymentTypeDto {
  @ApiProperty({ example: 'VENDOR_PAYMENT' })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'code must be uppercase alphanumeric (with _)' })
  code!: string;

  @ApiProperty({ example: 'Vendor Payment' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({ enum: PaymentDirection })
  @IsEnum(PaymentDirection)
  direction!: PaymentDirection;

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

  @ApiPropertyOptional({ type: [DocumentPolicyItemDto], default: [] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DocumentPolicyItemDto)
  documentPolicy?: DocumentPolicyItemDto[];

  @ApiPropertyOptional({ type: [FieldConfigItemDto], default: [] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FieldConfigItemDto)
  fieldConfig?: FieldConfigItemDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Defaults to today if omitted.',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string | null;
}
