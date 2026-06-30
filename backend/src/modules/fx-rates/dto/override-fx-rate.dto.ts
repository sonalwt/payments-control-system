import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
} from 'class-validator';

const upper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase().trim() : value;

export class OverrideFxRateDto {
  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(upper)
  baseCurrencyCode?: string;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  @Length(3, 3)
  @Transform(upper)
  quoteCurrencyCode!: string;

  // Accepts a numeric string from the form; validated as a positive number.
  @ApiProperty({ example: '0.9234' })
  @Transform(({ value }) => (value === '' || value == null ? value : Number(value)))
  @IsPositive()
  rate!: number;

  @ApiPropertyOptional({ example: '2026-05-24', description: 'As-of day; defaults to today (Dubai)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'asOfDate must be YYYY-MM-DD' })
  asOfDate?: string;

  @ApiProperty({ example: 'Treasury-confirmed cross rate per CFO email 2026-05-24.' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 1000)
  reason!: string;
}
