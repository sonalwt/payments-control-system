import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

const upper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

/**
 * Manual override of the recorded rate for a (base, quote) pair on a given day
 * (§2.2). The supplied reason is captured and the action is audited.
 */
export class OverrideFxRateDto {
  @ApiProperty({ example: 'USD', description: 'ISO 4217 alpha-3 base currency' })
  @Transform(upper)
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'baseCurrencyCode must be 3 letters' })
  baseCurrencyCode!: string;

  @ApiProperty({ example: 'EUR', description: 'ISO 4217 alpha-3 quote currency' })
  @Transform(upper)
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'quoteCurrencyCode must be 3 letters' })
  quoteCurrencyCode!: string;

  @ApiProperty({ example: '0.9234', description: 'Mid-rate of base 1 → quote' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d+(\.\d{1,10})?$/, {
    message: 'rate must be a positive decimal with up to 10 places',
  })
  rate!: string;

  @ApiPropertyOptional({
    example: '2026-05-24',
    description: 'Effective date (YYYY-MM-DD). Defaults to today (Dubai).',
  })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiProperty({ example: 'Treasury-confirmed cross rate per CFO email.' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 2000)
  reason!: string;
}
