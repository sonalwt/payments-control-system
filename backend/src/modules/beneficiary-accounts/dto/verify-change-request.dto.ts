import { IsOptional, IsString } from 'class-validator';

export class VerifyChangeRequestDto {
  @IsString() @IsOptional()
  verificationNotes?: string;

  @IsString() @IsOptional()
  callbackEvidence?: string;
}
