import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class ResolveChainDto {
  @ApiProperty({ example: 'VENDOR_PAYMENT' })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/)
  paymentTypeCode!: string;

  @ApiProperty({ example: 'INR' })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currencyCode!: string;

  @ApiProperty({ example: 250000000, description: 'Amount in currency minor units' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountMinor!: number;

  @ApiPropertyOptional({
    example: '2026-05-24',
    description:
      'As-of date for matrix selection. Defaults to today. Pin to the request submission date so in-flight requests retain their original chain.',
  })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}
