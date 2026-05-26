import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * §8.1 — CSV column mapping. Optional; if not supplied the parser attempts
 * a heuristic resolution against the headers in the file.
 */
export class CsvColumnMappingDto {
  @IsString() @IsOptional() valueDate?: string;
  @IsString() @IsOptional() postingDate?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() debit?: string;
  @IsString() @IsOptional() credit?: string;
  @IsString() @IsOptional() signedAmount?: string;
  @IsString() @IsOptional() reference?: string;
  @IsString() @IsOptional() counterparty?: string;
  @IsString() @IsOptional() balance?: string;
  @IsString() @IsOptional() directionColumn?: string;
}

export class IngestCsvDto {
  /** Optional override; defaults to the StatementUpload.fileUrl. */
  @IsString() @IsOptional() csvFileUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CsvColumnMappingDto)
  columnMapping?: CsvColumnMappingDto;

  @IsBoolean() @IsOptional() runAutoMatch?: boolean;
}

/** §8.1 — manual fallback when the file is a PDF (no OCR wired) or a CSV
 *  layout the parser cannot resolve. */
export class ManualStatementLineDto {
  @IsDateString() valueDate!: string;
  @IsDateString() @IsOptional() postingDate?: string;

  @IsIn(['DEBIT', 'CREDIT'])
  direction!: 'DEBIT' | 'CREDIT';

  @IsNumber() @Type(() => Number) amount!: number;
  @IsString() @IsNotEmpty() currencyCode!: string;
  @IsString() @IsOptional() bankReference?: string;
  @IsString() @IsOptional() counterpartyText?: string;
  @IsString() @IsOptional() narrative?: string;
  @IsNumber() @IsOptional() @Type(() => Number) runningBalance?: number;
}

export class IngestManualDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualStatementLineDto)
  lines!: ManualStatementLineDto[];

  @IsBoolean() @IsOptional() runAutoMatch?: boolean;
}
