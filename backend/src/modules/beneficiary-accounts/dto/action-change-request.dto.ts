import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveChangeRequestDto {
  @IsString() @IsOptional()
  notes?: string;
}

export class RejectChangeRequestDto {
  @IsString() @IsNotEmpty()
  reason!: string;
}
