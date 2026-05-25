import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** POST /payment-requests/:id/approve */
export class ApprovePaymentRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comments?: string;

  /**
   * §6.5 — Required when the payment request has sanction_warning = true.
   * The final approver must explicitly acknowledge the sanctions risk in writing.
   */
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  sanctionAcknowledgement?: string;
}

/** POST /payment-requests/:id/reject */
export class RejectPaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

/** POST /payment-requests/:id/withdraw */
export class WithdrawPaymentRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reason?: string;
}

/** POST /payment-requests/:id/cancel  (admin action) */
export class CancelPaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

/** POST /payment-requests/:id/release  (Maker → AWAITING_PAYMENT_CONFIRMATION) */
export class ReleasePaymentRequestDto {
  @IsUUID()
  sourceAccountId!: string;

  @IsBoolean()
  @IsOptional()
  isCrossCurrency?: boolean;

  /** Indicative source-currency equivalent for cross-currency (§2.6). */
  @IsString()
  @IsOptional()
  indicativeSourceAmount?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  makerNotes?: string;
}

/** POST /payment-requests/:id/mark-paid  (Maker → PAID) */
export class MarkPaidDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankReference!: string;

  @IsDateString()
  valueDate!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  proofOfPaymentUrl?: string;
}
