import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';

const ACCOUNT_TYPES = ['CURRENT', 'COLLATERAL', 'DEPOSIT'] as const;

export class CreateBankAccountDto {
  @ApiProperty({ example: 'DBS Singapore — Operating' })
  @IsString()
  @Length(2, 120)
  nickname!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  legalEntityId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  bankId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  currencyId!: string;

  @ApiProperty({ example: '003-901234-5' })
  @IsString()
  @Length(2, 50)
  accountNumber!: string;

  @ApiPropertyOptional({ example: 'SG12DBSS0030901234' })
  @IsOptional()
  @IsString()
  @Length(15, 34)
  iban?: string;

  @ApiProperty({ enum: ACCOUNT_TYPES })
  @IsIn(ACCOUNT_TYPES as unknown as string[])
  accountType!: (typeof ACCOUNT_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 120)
  branchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 30)
  branchCode?: string;

  @ApiPropertyOptional({
    example: '125000.0000',
    description: 'Opening balance in account currency (seeded at go-live).',
  })
  @IsOptional()
  @IsNumberString()
  openingBalance?: string;

  @ApiPropertyOptional({
    example: '50000.0000',
    description:
      'Minimum balance, mandatory and only applicable when accountType is CURRENT.',
  })
  @ValidateIf((o: CreateBankAccountDto) => o.accountType === 'CURRENT')
  @IsNumberString()
  minimumBalance?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Chairman-designated source account (§9.2). Cannot be selected for any non-chairman payment.',
  })
  @IsOptional()
  @IsBoolean()
  isChairmanDesignated?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
