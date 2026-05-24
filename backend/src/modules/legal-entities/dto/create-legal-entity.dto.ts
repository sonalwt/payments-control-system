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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  groupId!: string;

  @ApiProperty({ example: 'Acme India Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ example: 'ACME-IN' })
  @IsString()
  @Length(2, 30)
  @Matches(/^[A-Z0-9_-]+$/)
  code!: string;

  @ApiProperty({ example: 'IN', description: 'ISO 3166-1 alpha-2' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  registeredCountry!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  baseCurrencyId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  approvalMatrixRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 50)
  taxIdentifier?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
