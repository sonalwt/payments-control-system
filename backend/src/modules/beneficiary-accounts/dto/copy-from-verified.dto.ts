import { IsOptional, IsUUID } from 'class-validator';

/**
 * POST /beneficiary-accounts/:id/copy
 * Copies an ACTIVE beneficiary account to a new owner (§6.3 same-group rule).
 * Exactly one of counterpartyId or employeeId must be provided.
 */
export class CopyFromVerifiedDto {
  @IsUUID()
  @IsOptional()
  counterpartyId?: string;

  @IsUUID()
  @IsOptional()
  employeeId?: string;
}
