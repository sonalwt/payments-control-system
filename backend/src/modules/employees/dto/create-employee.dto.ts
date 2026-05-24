import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'SG-0001' })
  @IsString()
  @Length(1, 40)
  @Matches(/^[A-Za-z0-9._/-]+$/, {
    message: 'employeeCode may contain letters, digits, and . _ / -',
  })
  employeeCode!: string;

  @ApiProperty({ example: 'Aishwarya Nair' })
  @IsString()
  @Length(1, 150)
  fullName!: string;

  @ApiPropertyOptional({ example: 'Ash' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  preferredName?: string | null;

  @ApiPropertyOptional({ example: 'ash.nair@firsteconomy.com' })
  @IsOptional()
  @IsEmail()
  @Length(0, 254)
  workEmail?: string | null;

  @ApiProperty({ description: 'Employing legal entity (Section 1.1).' })
  @IsUUID()
  legalEntityId!: string;

  @ApiProperty({ example: 'SG', description: 'ISO 3166-1 alpha-2' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  countryCode!: string;

  @ApiProperty({ description: 'Currency in which the employee is paid.' })
  @IsUUID()
  baseCurrencyId!: string;

  @ApiProperty({
    example: 'STAFF',
    description:
      'Free-form payroll category (e.g. STAFF, EXEC, CONTRACTOR, INTERN).',
  })
  @IsString()
  @Length(1, 40)
  payrollCategory!: string;

  @ApiPropertyOptional({
    description:
      'Linked employee beneficiary bank account (Section 6). Set via the bank-account change workflow once available.',
  })
  @IsOptional()
  @IsUUID()
  employeeBankAccountId?: string | null;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  employmentStartDate?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  employmentEndDate?: string | null;

  @ApiPropertyOptional({ description: 'Sensitive — masked unless caller holds PAYROLL_PII_ACCESS.' })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  nationalId?: string | null;

  @ApiPropertyOptional({ description: 'Sensitive — masked unless caller holds PAYROLL_PII_ACCESS.' })
  @IsOptional()
  @IsString()
  @Length(0, 60)
  taxIdentifier?: string | null;

  @ApiPropertyOptional({ description: 'Sensitive — masked unless caller holds PAYROLL_PII_ACCESS.' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ description: 'Sensitive — masked unless caller holds PAYROLL_PII_ACCESS.' })
  @IsOptional()
  @IsString()
  @Length(0, 40)
  compensationBand?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
