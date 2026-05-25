import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IncomingReceiptDocumentDto } from './create-incoming-receipt.dto';

/** PATCH-style update; all fields optional, only DRAFT receipts are editable. */
export class UpdateIncomingReceiptDto {
  @IsUUID()
  @IsOptional()
  counterpartyId?: string;

  @IsUUID()
  @IsOptional()
  receiveFromAccountId?: string;

  @IsNumberString()
  @IsOptional()
  expectedAmount?: string;

  @IsString()
  @IsOptional()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  expectedCurrencyCode?: string;

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
