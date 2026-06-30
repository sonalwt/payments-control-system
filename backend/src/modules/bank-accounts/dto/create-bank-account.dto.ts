import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ChargeBandDto {
  @ApiProperty({ example: 0, description: 'Lower bound of the amount band (inclusive)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  minAmount!: number;

  @ApiPropertyOptional({ example: 1000, description: 'Upper bound (exclusive). Blank = and above.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  maxAmount?: number | null;

  @ApiProperty({ example: 2, description: 'Charge as a percentage of the amount (0–100)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  percentage!: number;
}

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Bank master UUID' })
  @IsUUID()
  bankId!: string;

  @ApiPropertyOptional({ description: 'Owning legal entity UUID — used as the account name (group accounts).' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;

  @ApiPropertyOptional({ example: 'HDFC – Main Operating', description: 'Free-text account name (counterparty accounts). Group accounts derive this from the legal entity.' })
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

  @ApiPropertyOptional({ example: 75000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  remainingBalance?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isChairmanDesignated?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Counterparty master UUID - required when isCounterparty = true' })
  @IsOptional()
  @IsUUID()
  counterpartyId?: string;

  @ApiPropertyOptional({ type: [ChargeBandDto], description: 'Tiered bank charges by amount band' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChargeBandDto)
  chargeBands?: ChargeBandDto[];
}
