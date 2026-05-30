import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class MatricesQueryDto extends PaginationQueryDto {
  /**
   * When set to "true", filter the list to matrices the current user
   * participates in (a step naming them as USER, a step naming a role
   * they hold, or the payment-type's maker / checker role they hold).
   */
  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  mine?: 'true' | 'false';
}
