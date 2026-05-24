import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStatementUploadDto {
  @IsUUID()
  bankAccountId!: string;

  @IsDateString()
  statementDate!: string;

  @IsNumber()
  @Type(() => Number)
  openingBalance!: number;

  @IsNumber()
  @Type(() => Number)
  closingBalance!: number;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  rowCount: number = 0;

  @IsString()
  @IsOptional()
  notes?: string;
}
