import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

class ChangeRequestDocumentDto {
  @ApiProperty({ example: 'CANCELLED_CHEQUE' })
  @IsString()
  @Length(2, 50)
  code!: string;

  @ApiProperty({ example: 'Cancelled cheque' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: 'cheque.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: '/uploads/cheque.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string | null;
}

/**
 * Body sent when a user proposes adding / modifying / deactivating a
 * beneficiary account. The actual beneficiary row is only created on
 * final approval (for ADD).
 */
export class CreateChangeRequestDto {
  @ApiProperty({ enum: ['ADD', 'MODIFY', 'DEACTIVATE'] })
  @IsEnum(['ADD', 'MODIFY', 'DEACTIVATE'])
  changeType!: 'ADD' | 'MODIFY' | 'DEACTIVATE';

  /** Required for MODIFY / DEACTIVATE; must be null for ADD. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryAccountId?: string | null;

  /** Proposed values. Shape depends on changeType. */
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  proposedData!: Record<string, unknown>;

  /** §6.2 mandatory supporting documents. */
  @ApiProperty({ type: [ChangeRequestDocumentDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one supporting document is required' })
  @ValidateNested({ each: true })
  @Type(() => ChangeRequestDocumentDto)
  documents!: ChangeRequestDocumentDto[];
}

export class VerifyChangeRequestDto {
  /** §6.2 callback evidence is mandatory before verification registers. */
  @ApiProperty({ example: 'Called Acme CFO on +91-... at 14:35, confirmed account details.' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 4000)
  callbackEvidence!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verificationNotes?: string;
}

export class ApproveChangeRequestDto {
  /** §6.3 — optional override of the default cooling-off period. */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsIn([true, false])
  coolingOffOverride?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coolingOffOverrideReason?: string;
}

export class RejectChangeRequestDto {
  @ApiProperty({ example: 'Bank letter signature does not match record.' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
