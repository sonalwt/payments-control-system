import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CounterpartyQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['VENDOR', 'CUSTOMER', 'BOTH'] })
  @IsOptional()
  @IsEnum(['VENDOR', 'CUSTOMER', 'BOTH'])
  role?: 'VENDOR' | 'CUSTOMER' | 'BOTH';
}
