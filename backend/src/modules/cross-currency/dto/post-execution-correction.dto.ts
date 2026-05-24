import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class PostExecutionCorrectionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceAccountId!: string;

  @ApiProperty({
    example: '12350.0000',
    description:
      'Amount originally debited (indicative source-currency equivalent applied at Paid).',
  })
  @IsNumberString()
  previouslyDebited!: string;

  @ApiProperty({
    example: '12384.7200',
    description: 'Actual amount debited per the bank advice / proof of payment.',
  })
  @IsNumberString()
  correctedAmount!: string;

  @ApiProperty({
    example:
      'OANDA mid was 1.0250; bank executed at 1.0275 per SWIFT MT103 ref 23X-99213.',
  })
  @IsString()
  @Length(5, 1000)
  reason!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  paymentRequestId?: string;
}
