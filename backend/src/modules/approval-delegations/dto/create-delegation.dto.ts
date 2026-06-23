import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDelegationDto {
  @IsUUID()
  delegateUserId!: string;

  /** Inclusive Dubai calendar day, YYYY-MM-DD. */
  @IsDateString()
  startDate!: string;

  /** Inclusive Dubai calendar day, YYYY-MM-DD. */
  @IsDateString()
  endDate!: string;

  /** When omitted/null, the delegation applies to all payment types. */
  @IsOptional()
  @IsUUID()
  paymentTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
