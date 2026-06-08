import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import type { IncomingReceiptStatus } from '../incoming-receipt.entity';

const AMOUNT_RE = /^\d+(\.\d{1,4})?$/;

export class AttachReceiptDocumentDto {
  @ApiProperty()
  @IsString()
  @Length(1, 50)
  documentCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  documentLabel?: string;

  @ApiProperty()
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  fileUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  mimeType?: string;
}

export class CreateIncomingReceiptDto {
  @ApiProperty()
  @IsUUID()
  legalEntityId!: string;

  @ApiProperty()
  @IsUUID()
  counterpartyId!: string;

  @ApiProperty()
  @IsUUID()
  receiveFromAccountId!: string;

  @ApiProperty({ example: '12500.0000' })
  @IsString()
  @Matches(AMOUNT_RE, { message: 'Amount must be a positive decimal with up to 4 decimal places' })
  expectedAmount!: string;

  @ApiProperty({ example: 'AED' })
  @IsString()
  @Length(1, 10)
  expectedCurrencyCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purposeDescription?: string;

  @ApiPropertyOptional({ type: [AttachReceiptDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachReceiptDocumentDto)
  documents?: AttachReceiptDocumentDto[];
}

/** Legal entity is locked after creation (§7); everything else is editable on a DRAFT. */
export class UpdateIncomingReceiptDto extends PartialType(
  OmitType(CreateIncomingReceiptDto, ['legalEntityId'] as const),
) {}

export class MarkReceivedDto {
  @ApiProperty()
  @IsUUID()
  receiveFromAccountId!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 140)
  inwardBankReference!: string;

  @ApiProperty({ example: '2026-06-08' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'receivedDate must be an ISO date (YYYY-MM-DD)' })
  receivedDate!: string;

  @ApiProperty({ example: '12500.0000' })
  @IsString()
  @Matches(AMOUNT_RE, { message: 'Amount must be a positive decimal with up to 4 decimal places' })
  receivedAmount!: string;

  @ApiProperty({ example: 'AED' })
  @IsString()
  @Length(1, 10)
  receivedCurrencyCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CancelReceiptDto {
  @ApiProperty()
  @IsString()
  @Length(1, 1000)
  reason!: string;
}

export class IncomingReceiptQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'AWAITING_RECEIPT', 'RECEIVED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: IncomingReceiptStatus;
}
