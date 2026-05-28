import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class BusinessUnitQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by legal entity UUID' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;
}
