import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
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

/**
 * Treasury maker submits the bank reference + SWIFT/MT103 copy received from
 * the bank, forwarding the request to the treasury checker.
 */
export class TreasurySubmitDto {
  @ApiProperty({ example: 'FT26154ABCD' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  referenceNumber!: string;

  @ApiProperty({ example: '/uploads/mt103.pdf' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  swiftCopyUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}

/** Treasury checker / authoriser sign-off — optional note only. */
export class TreasuryDecisionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}

/**
 * Treasury authoriser completion. For confidential (chairman-style) payments
 * there is no treasury maker stage, so the authoriser captures the bank
 * reference + SWIFT/MT103 copy here while marking the payment completed.
 * Both are optional for the standard flow (already captured by the maker).
 */
export class TreasuryCompleteDto {
  @ApiPropertyOptional({ example: 'FT26154ABCD' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  referenceNumber?: string;

  @ApiPropertyOptional({ example: '/uploads/mt103.pdf' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  swiftCopyUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}

export class AttachDocumentDto {
  @ApiProperty({ example: 'INVOICE' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  documentCode!: string;

  @ApiPropertyOptional({ example: 'Invoice PDF' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  documentLabel?: string;

  @ApiProperty({ example: 'invoice.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: '/uploads/1780139560293-420008.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 204800 })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;
}
