import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

class AttachDocumentDto {
  @ApiProperty({ example: 'INVOICE' })
  @IsString()
  @Length(2, 50)
  documentCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  documentLabel?: string;

  @ApiProperty({ example: 'invoice.pdf' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ example: '/uploads/invoice.pdf' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  fileUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSizeBytes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;
}

/**
 * Body for POST /payment-requests. Creates a request in DRAFT status.
 * The matrix is only snapshotted at /submit.
 */
export class CreatePaymentRequestDto {
  @ApiProperty()
  @IsUUID()
  paymentTypeId!: string;

  @ApiPropertyOptional({ description: 'Required for vendor / incoming receipt types.' })
  @IsOptional()
  @IsUUID()
  counterpartyId?: string;

  @ApiPropertyOptional({ description: 'Required for payroll / reimbursement / FnF.' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Destination beneficiary from the master.' })
  @IsOptional()
  @IsUUID()
  beneficiaryAccountId?: string;

  @ApiPropertyOptional({ description: 'Source bank account (group own) from which the payment is to be made.' })
  @IsOptional()
  @IsUUID()
  sourceAccountId?: string;

  @ApiProperty()
  @IsUUID()
  currencyId!: string;

  @ApiProperty({ example: '12500.0000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, { message: 'Amount must be a positive decimal with up to 4 decimal places' })
  amount!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purposeDescription?: string;

  /** §4.1 — alphanumeric, no spaces. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 60)
  @Matches(/^[A-Za-z0-9\-_/]+$/, {
    message: 'Invoice number is alphanumeric; spaces are not permitted.',
  })
  invoiceNumber?: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: [AttachDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachDocumentDto)
  documents?: AttachDocumentDto[];
}
