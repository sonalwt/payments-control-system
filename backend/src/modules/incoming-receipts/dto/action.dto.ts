import {
  IsDateString,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * §7.3 — POST /incoming-receipts/:id/mark-received
 * Captures the bank-credit event and triggers the credit to the receive-from
 * account.
 */
export class MarkReceivedDto {
  @IsUUID()
  receiveFromAccountId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  inwardBankReference!: string;

  @IsDateString()
  receivedDate!: string;

  @IsNumberString()
  receivedAmount!: string;

  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  receivedCurrencyCode!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  remarks?: string;
}

/** POST /incoming-receipts/:id/cancel */
export class CancelIncomingReceiptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}
