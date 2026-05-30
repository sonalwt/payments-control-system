import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class ApproveDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  /** §6.5 — required when the request carries a sanction_warning. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(10, 4000)
  sanctionOverrideReason?: string;
}

export class RejectDto {
  @ApiProperty({ example: 'Missing PO reference.' })
  @IsString()
  @IsNotEmpty()
  @Length(5, 4000)
  comments!: string;
}

export class WithdrawDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

/** §4.3 — Maker releases an approved request to the bank portal. */
export class ReleaseDto {
  @ApiProperty()
  @IsUUID()
  sourceAccountId!: string;
}

/** §4.4 — Maker captures bank reference + value date to move to PAID. */
export class MarkPaidDto {
  @ApiProperty({ example: 'WIRE12345' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  bankReference!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  valueDate!: string;
}

export class UploadProofDto {
  @ApiProperty({ example: '/uploads/mt103.pdf' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  proofOfPaymentUrl!: string;
}
