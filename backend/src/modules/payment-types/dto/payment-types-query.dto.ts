import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class PaymentTypesQueryDto extends PaginationQueryDto {
  /**
   * When set to "true", restrict the list to payment types where the
   * current user holds the maker_role_id - i.e. payment types they are
   * eligible to initiate a request for.
   */
  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  mine?: 'true' | 'false';

  /** Optional filter by payment category UUID. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paymentCategoryId?: string;
}
