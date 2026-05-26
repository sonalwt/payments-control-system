import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DocumentAttachmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentCode!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  documentLabel?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileUrl!: string;

  @IsInt()
  @IsOptional()
  fileSizeBytes?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  mimeType?: string;
}

export class CreatePaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  paymentTypeCode!: string;

  @IsUUID()
  legalEntityId!: string;

  @IsUUID()
  @IsOptional()
  counterpartyId?: string;

  @IsUUID()
  @IsOptional()
  employeeId?: string;

  /** §6 — Destination account from the verified beneficiary master. */
  @IsUUID()
  @IsOptional()
  beneficiaryAccountId?: string;

  /** ISO 4217 currency code for the payment. */
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  currencyCode!: string;

  /** Decimal string, e.g. "12500.00". */
  @IsString()
  @IsNotEmpty()
  amount!: string;

  /** Amount in minor units for approval-matrix band matching. */
  @IsInt()
  @IsPositive()
  amountMinor!: number;

  @IsString()
  @IsOptional()
  purposeDescription?: string;

  /**
   * §4.1 — Invoice number: alphanumeric only, no spaces.
   * Required for VENDOR_PAYMENT payment type; optional for all others.
   */
  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Matches(/^[A-Za-z0-9\-_/]+$/, {
    message: 'Invoice number must be alphanumeric with no spaces (hyphens and slashes are allowed)',
  })
  invoiceNumber?: string;

  /** §4.1 — Invoice payment due date (ISO date string, e.g. "2024-12-31"). */
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  /** Documents to attach at creation time (may also be added later). */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentAttachmentDto)
  @IsOptional()
  documents?: DocumentAttachmentDto[];

  /** §9 — Set to true to flag this as a confidential chairman payment. */
  @IsBoolean()
  @IsOptional()
  isChairmanPayment?: boolean;

  /** §9 — Required when isChairmanPayment = true. Must point to an ACTIVE chairman beneficiary. */
  @IsUUID()
  @IsOptional()
  chairmanBeneficiaryId?: string;
}
