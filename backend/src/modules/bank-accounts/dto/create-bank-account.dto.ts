import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Bank master UUID' })
  @IsUUID()
  bankId!: string;

  @ApiPropertyOptional({ example: 'HDFC – Main Operating' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  bankNickname?: string;

  @ApiProperty({ description: 'Currency master UUID' })
  @IsUUID()
  currencyId!: string;

  @ApiProperty({ description: 'Account type master UUID' })
  @IsUUID()
  accountTypeId!: string;

  @ApiProperty({ example: '50100123456789' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  accountNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 150)
  branchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 50)
  branchCode?: string;

  @ApiPropertyOptional({ example: 100000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  openingBalance?: number;

  @ApiPropertyOptional({ example: 50000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  minimumBalance?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isChairmanDesignated?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
