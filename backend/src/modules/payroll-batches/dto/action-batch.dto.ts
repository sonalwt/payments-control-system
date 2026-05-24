import { IsOptional, IsString } from 'class-validator';

export class RejectBatchDto {
  @IsString()
  reason!: string;
}

export class CancelBatchDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
