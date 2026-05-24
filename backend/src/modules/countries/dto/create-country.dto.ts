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

export class CreateCountryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  legalEntityId!: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: 'IN' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  isoCode!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
