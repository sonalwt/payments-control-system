import { IsOptional, IsString } from 'class-validator';

export class VerifyChairmanCrDto {
  @IsString() @IsOptional()
  verificationNotes?: string;

  @IsString() @IsOptional()
  callbackEvidence?: string;
}
