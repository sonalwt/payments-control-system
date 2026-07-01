import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDelegationDto {
  @ApiProperty({ description: 'UUID of the user to delegate tasks to' })
  @IsUUID()
  delegateeId!: string;

  @ApiProperty({ example: '2026-07-01', description: 'Delegation start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-07-15', description: 'Delegation end date (YYYY-MM-DD)' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Optional reason for delegation' })
  @IsOptional()
  @IsString()
  reason?: string;
}
