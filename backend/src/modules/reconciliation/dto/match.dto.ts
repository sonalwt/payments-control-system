import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ConfirmMatchDto {
  /** Override or confirm the candidate target. Exactly one of these
   *  should be set if the line carries no pre-pinned candidate. */
  @IsUUID() @IsOptional() paymentRequestId?: string;
  @IsUUID() @IsOptional() incomingReceiptId?: string;
  @IsString() @IsOptional() note?: string;
}

export class UnmatchLineDto {
  @IsString() @IsNotEmpty() reason!: string;
}
