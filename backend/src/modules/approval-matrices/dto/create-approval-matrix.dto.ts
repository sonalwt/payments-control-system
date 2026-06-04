import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

class StepDto {
  @ApiProperty({ enum: ['USER', 'ROLE'] })
  @IsEnum(['USER', 'ROLE'])
  approverType!: 'USER' | 'ROLE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  approverUserId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  approverRoleId?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}

class BandDto {
  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  minAmount!: number;

  @ApiPropertyOptional({ description: 'Open-ended top band when omitted' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  maxAmount?: number | null;

  @ApiProperty({ type: [StepDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  steps!: StepDto[];
}

export class CreateApprovalMatrixDto {
  @ApiProperty({ example: 'Trade Payments — USD' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Payment type master UUID' })
  @IsUUID()
  paymentTypeId!: string;

  @ApiProperty({ description: 'Currency master UUID (native — no FX conversion)' })
  @IsUUID()
  currencyId!: string;

  @ApiProperty({
    enum: ['ONLINE_TT', 'OFFLINE_TT'],
    description: 'Treasury Team that executes the payment after final approval',
  })
  @IsEnum(['ONLINE_TT', 'OFFLINE_TT'])
  ttMode!: 'ONLINE_TT' | 'OFFLINE_TT';

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  effectiveFrom!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiProperty({ type: [BandDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BandDto)
  bands!: BandDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
