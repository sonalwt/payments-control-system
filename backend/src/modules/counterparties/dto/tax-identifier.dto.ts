import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import type { TaxIdentifierType } from '../counterparty.entity';

const TAX_TYPES: TaxIdentifierType[] = [
  'TRN',
  'GSTIN',
  'VAT',
  'PAN',
  'EIN',
  'OTHER',
];

export class TaxIdentifierDto {
  @ApiProperty({ enum: TAX_TYPES, example: 'GSTIN' })
  @IsIn(TAX_TYPES)
  type!: TaxIdentifierType;

  @ApiProperty({ example: '29ABCDE1234F2Z5' })
  @IsString()
  @Length(1, 60)
  value!: string;

  @ApiPropertyOptional({ description: 'Human label for OTHER types' })
  @IsOptional()
  @IsString()
  @Length(0, 80)
  label?: string | null;
}
