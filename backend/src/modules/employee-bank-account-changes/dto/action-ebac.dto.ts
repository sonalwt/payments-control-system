import { IsOptional, IsString } from 'class-validator';

export class VerifyEbacDto {
  @IsOptional()
  @IsString()
  verificationNotes?: string;

  @IsOptional()
  @IsString()
  callbackEvidence?: string;
}

export class RejectEbacDto {
  @IsString()
  reason!: string;
}

export class CancelEbacDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
