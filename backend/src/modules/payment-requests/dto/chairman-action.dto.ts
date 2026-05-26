import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

/**
 * §9 — PAYMENTS_MAKER prepares the TT: selects source account, flags
 * cross-currency, and optionally records an indicative source amount.
 */
export class ChairmanPrepareDto {
  @IsUUID()
  sourceAccountId!: string;

  @IsBoolean()
  @IsOptional()
  isCrossCurrency?: boolean;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  @IsOptional()
  indicativeSourceAmount?: number;

  @IsString()
  @IsOptional()
  makerNotes?: string;
}

/**
 * §9 — PAYMENTS_CHECKER verifies documents before forwarding to the head.
 */
export class ChairmanVerifyDto {
  @IsString()
  @IsNotEmpty()
  checkerNotes!: string;
}

/**
 * §9 — PAYMENTS_HEAD approves execution.
 */
export class ChairmanApproveDto {
  @IsString()
  @IsOptional()
  comments?: string;
}
