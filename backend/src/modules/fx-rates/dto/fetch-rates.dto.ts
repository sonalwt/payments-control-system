import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, Length, Matches } from 'class-validator';

export class FetchRatesDto {
  @ApiPropertyOptional({ example: 'USD', description: 'Base currency; defaults to USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  baseCurrencyCode?: string;

  @ApiPropertyOptional({ example: '2026-05-24' })
  @IsOptional()
  @IsISO8601()
  asOfDate?: string;
}
