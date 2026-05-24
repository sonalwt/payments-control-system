import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateBankDto {
  @ApiProperty({ example: 'HSBC' })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional({ example: 'HSBC SG' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  shortName?: string;

  @ApiProperty({ example: 'SG', description: 'ISO 3166-1 alpha-2' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  countryCode!: string;

  @ApiPropertyOptional({
    example: 'HSBCSGSG',
    description: '8 or 11 char SWIFT / BIC, alphanumeric uppercase',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/, {
    message: 'swiftBic must be 8 or 11 alphanumeric uppercase characters',
  })
  swiftBic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 500)
  address?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
