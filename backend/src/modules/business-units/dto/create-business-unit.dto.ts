import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateBusinessUnitDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  countryId!: string;

  @ApiProperty({ example: 'Retail Banking' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ example: 'RETAIL' })
  @IsString()
  @Length(2, 30)
  @Matches(/^[A-Z0-9_-]+$/)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
