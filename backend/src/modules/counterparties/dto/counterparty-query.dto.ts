import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CounterpartyQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['VENDOR', 'CUSTOMER', 'BOTH'] })
  @IsOptional()
  @IsEnum(['VENDOR', 'CUSTOMER', 'BOTH'])
  role?: 'VENDOR' | 'CUSTOMER' | 'BOTH';

  // KYC state filter for the unified counterparties list. PENDING/FLAGGED mirror
  // the review-queue semantics; APPROVED/REJECTED narrow to settled records.
  @ApiPropertyOptional({ enum: ['PENDING', 'FLAGGED', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'FLAGGED', 'APPROVED', 'REJECTED'])
  kyc?: 'PENDING' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
}
