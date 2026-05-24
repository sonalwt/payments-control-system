import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class IndicativeEquivalentQueryDto {
  @ApiProperty({ format: 'uuid', description: 'Source (entity-owned) CURRENT account' })
  @IsUUID()
  sourceAccountId!: string;

  @ApiProperty({ example: 'EUR', description: 'Payment currency requested by the maker' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  paymentCurrencyCode!: string;

  @ApiProperty({
    example: '12500.00',
    description: 'Payment-currency amount the maker intends to release.',
  })
  @IsNumberString()
  paymentAmount!: string;

  @ApiPropertyOptional({ example: '2026-05-24', description: 'As-of date for rate resolution' })
  @IsOptional()
  @IsISO8601()
  asOfDate?: string;
}
