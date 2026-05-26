import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveChairmanCrDto {
  @IsString() @IsOptional()
  notes?: string;

  /** §9 / §6.5 — Required when sanctionWarning = true. */
  @IsString() @IsOptional()
  sanctionAcknowledgement?: string;
}

export class RejectChairmanCrDto {
  @IsString() @IsNotEmpty()
  reason!: string;
}
