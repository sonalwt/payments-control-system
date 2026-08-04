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

  // ---- Bank-account master sheet details ------------------------------------

  @ApiPropertyOptional({ example: 'ACME Trading Pte Ltd', description: 'Account holder name as printed by the bank' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  accountHolderName?: string;

  @ApiPropertyOptional({ example: 'HSBCSGSG', description: "The account's own SWIFT / BIC" })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  swiftBic?: string;

  @ApiPropertyOptional({ example: 'GB82UBIN23562602310009' })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  iban?: string;

  @ApiPropertyOptional({ example: '061000227', description: 'US ABA / Fedwire routing number' })
  @IsOptional()
  @IsString()
  @Length(0, 40)
  abaNumber?: string;

  @ApiPropertyOptional({ example: '7214', description: 'Local clearing bank code' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  bankCode?: string;

  @ApiPropertyOptional({ example: '23-56-26', description: 'UK sort code' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  sortCode?: string;

  @ApiPropertyOptional({ example: '000000477', description: "The bank's customer / CIF id" })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  customerId?: string;

  @ApiPropertyOptional({ description: 'Branch address of the account-holding bank' })
  @IsOptional()
  @IsString()
  bankAddress?: string;

  @ApiPropertyOptional({ example: 'JP Morgan Chase Bank, New York, USA', description: 'Intermediary / correspondent bank' })
  @IsOptional()
  @IsString()
  correspondentBank?: string;

  @ApiPropertyOptional({ example: 'CHASUS33', description: 'Intermediary / correspondent SWIFT' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  correspondentSwift?: string;

  @ApiPropertyOptional({ example: 'Connie Low', description: 'Relationship manager' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  contactName?: string;

  @ApiPropertyOptional({ example: '(65) 6596 5442', description: 'Relationship manager telephone' })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  contactPhone?: string;

  @ApiPropertyOptional({ example: '(65) 8612 6710', description: 'Relationship manager mobile' })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  contactPhoneAlt?: string;

  @ApiPropertyOptional({ example: 'connie.low@sc.com', description: 'Relationship manager email' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Bank fax number' })
  @IsOptional()
  @IsString()
  @Length(0, 80)
  fax?: string;

  @ApiPropertyOptional({ example: 'Nanda Kumar Pillai', description: 'Authorised signatory on the account' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  authSignatory?: string;

  @ApiPropertyOptional({ description: 'Email registered with the bank for this account' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  registeredEmail?: string;

  // ---------------------------------------------------------------------------

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
