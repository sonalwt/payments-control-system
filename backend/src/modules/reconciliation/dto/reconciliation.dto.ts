import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import type {
  ReconciliationExceptionStatus,
  ReconciliationExceptionType,
} from '../reconciliation-exception.entity';

export class CreateStatementUploadDto {
  @ApiProperty()
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty({ example: '2026-06-08' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'statementDate must be an ISO date (YYYY-MM-DD)' })
  statementDate!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  openingBalance!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  closingBalance!: number;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  fileUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StatementUploadQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;
}

export class IngestDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  runAutoMatch?: boolean;
}

export class ConfirmMatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UnmatchDto {
  @ApiProperty()
  @IsString()
  @Length(1, 1000)
  reason!: string;
}

export class ExceptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: ReconciliationExceptionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exceptionType?: ReconciliationExceptionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  statementUploadId?: string;
}

export class InvestigateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ResolveExceptionDto {
  @ApiProperty()
  @IsString()
  @Length(1, 2000)
  resolutionNote!: string;
}
