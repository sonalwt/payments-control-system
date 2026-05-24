import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class OverrideFxRateDto {
  @ApiProperty({ example: 'USD' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  baseCurrencyCode!: string;

  @ApiProperty({ example: 'EUR' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  quoteCurrencyCode!: string;

  @ApiProperty({ example: '0.9234', description: 'Direct quote (base 1 -> quote)' })
  @IsNumberString({ no_symbols: false })
  rate!: string;

  @ApiPropertyOptional({ example: '2026-05-24', description: 'YYYY-MM-DD; defaults to today' })
  @IsOptional()
  @IsISO8601()
  asOfDate?: string;

  @ApiProperty({
    example: 'Vendor disputed OANDA mid; using treasury-confirmed cross-rate per CFO email.',
  })
  @IsString()
  @Length(5, 1000)
  reason!: string;
}
