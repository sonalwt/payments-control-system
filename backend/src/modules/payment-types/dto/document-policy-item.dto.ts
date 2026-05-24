import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class DocumentPolicyItemDto {
  @ApiProperty({ example: 'INVOICE_PDF' })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'code must be uppercase alphanumeric (with _)' })
  code!: string;

  @ApiProperty({ example: 'Invoice PDF' })
  @IsString()
  @Length(1, 120)
  label!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional({
    description: 'Minor-unit threshold above which this document becomes mandatory',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountThresholdMinor?: number | null;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string | null;
}
