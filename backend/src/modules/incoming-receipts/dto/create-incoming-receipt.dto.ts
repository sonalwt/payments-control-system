import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';

export class IncomingReceiptDocumentDto {
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

  @IsOptional()
  fileSizeBytes?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  mimeType?: string;
}

export class CreateIncomingReceiptDto {
  @IsUUID()
  legalEntityId!: string;

  @IsUUID()
  counterpartyId!: string;

  /** §7.1 — Required: the group bank account expected to receive the credit. */
  @IsUUID()
  receiveFromAccountId!: string;

  @IsNumberString()
  expectedAmount!: string;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  expectedCurrencyCode!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  purposeDescription?: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => IncomingReceiptDocumentDto)
  documents?: IncomingReceiptDocumentDto[];
}
