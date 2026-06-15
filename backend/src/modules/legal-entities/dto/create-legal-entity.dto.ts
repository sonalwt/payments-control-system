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

export class CreateLegalEntityDto {
  @ApiProperty({ example: 'ACME Technologies India Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ example: 'ACME-IN' })
  @IsString()
  @Length(2, 30)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code must contain only uppercase letters, digits, underscore or hyphen',
  })
  code!: string;

  @ApiProperty({ description: 'Country master UUID' })
  @IsUUID()
  countryId!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
