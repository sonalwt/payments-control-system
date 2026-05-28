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

export class CreateBankDto {
  @ApiProperty({ example: 'HDFC Bank' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ example: 'HDFC' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  shortName?: string;

  @ApiProperty({ description: 'Country master UUID' })
  @IsUUID()
  countryId!: string;

  @ApiPropertyOptional({ example: 'HDFCINBB', description: 'SWIFT / BIC (8 or 11 chars)' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/, {
    message: 'SWIFT/BIC must be 8 or 11 uppercase alphanumeric characters',
  })
  swiftBic?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
