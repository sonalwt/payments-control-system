import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'AUD', description: 'ISO 4217 alpha-3' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'code must be an ISO 4217 alpha-3 code' })
  code!: string;

  @ApiProperty({ example: 'Australian Dollar' })
  @IsString()
  @Length(1, 80)
  name!: string;

  @ApiPropertyOptional({ example: '036', description: 'ISO 4217 numeric code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[0-9]{3}$/)
  numericCode?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of fractional digits (e.g. 2 for USD, 0 for JPY)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  minorUnit?: number;

  @ApiPropertyOptional({ example: 'A$' })
  @IsOptional()
  @IsString()
  @Length(1, 8)
  symbol?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
