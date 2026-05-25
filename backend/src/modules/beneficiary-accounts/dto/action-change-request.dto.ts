import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveChangeRequestDto {
  @IsString() @IsOptional()
  notes?: string;

  /** §6.5 — Required when the change request carries sanctionWarning = true. */
  @IsString() @IsOptional()
  sanctionAcknowledgement?: string;
}

export class RejectChangeRequestDto {
  @IsString() @IsNotEmpty()
  reason!: string;
}
