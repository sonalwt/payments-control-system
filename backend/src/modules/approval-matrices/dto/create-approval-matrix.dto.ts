import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { MatrixBandDto } from './matrix-band.dto';

export class CreateApprovalMatrixDto {
  @ApiProperty({ example: 'Vendor Payment — Standard' })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({
    example: 'VENDOR_PAYMENT',
    description: 'Stable payment-type code',
  })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'code must be uppercase alphanumeric (with _)' })
  paymentTypeCode!: string;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Date from which this matrix takes effect once published. Defaults to today.',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiProperty({ type: [MatrixBandDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MatrixBandDto)
  bands!: MatrixBandDto[];
}
