import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

/** KYC team rejects a counterparty (creation request or flagged add). */
export class KycRejectDto {
  @ApiProperty({ example: 'Tax identifiers could not be verified.' })
  @IsString()
  @IsNotEmpty()
  @Length(5, 4000)
  reason!: string;
}

/** Filter for the KYC review queue. */
export class KycListQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'FLAGGED', 'ALL'], default: 'PENDING' })
  @IsOptional()
  @IsIn(['PENDING', 'FLAGGED', 'ALL'])
  filter?: 'PENDING' | 'FLAGGED' | 'ALL';
}
