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
  IsUUID,
  Length,
  Matches,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

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

  @ApiPropertyOptional({
    default: false,
    description: 'When true the employee is the maker — selectable in the employee self-service portal.',
  })
  @IsOptional()
  @IsBoolean()
  employeeSelfService?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowsCrossCurrency?: boolean;

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

  @ApiPropertyOptional({ description: 'Payment category master UUID' })
  @IsOptional()
  @IsUUID()
  paymentCategoryId?: string | null;

  @ApiPropertyOptional({
    description:
      'Legal entity master UUID this payment type belongs to. Required unless the type is confidential (chairman-style).',
  })
  @ValidateIf((o) => !o.isConfidential)
  @IsUUID()
  legalEntityId?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Maker (creator) role UUIDs. Any user holding one of these roles may create requests for this payment type.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  makerRoleIds?: string[];

  @ApiPropertyOptional({ description: 'Deprecated — single Maker role UUID. Prefer makerRoleIds.' })
  @IsOptional()
  @IsUUID()
  makerRoleId?: string | null;

  @ApiPropertyOptional({ description: 'Default Checker role UUID' })
  @IsOptional()
  @IsUUID()
  checkerRoleId?: string | null;

  @ApiPropertyOptional({ description: 'Default Maker user UUID (when maker is a specific user, not a role)' })
  @IsOptional()
  @IsUUID()
  makerUserId?: string | null;

  @ApiPropertyOptional({ description: 'Default Checker user UUID (when checker is a specific user, not a role)' })
  @IsOptional()
  @IsUUID()
  checkerUserId?: string | null;
}
