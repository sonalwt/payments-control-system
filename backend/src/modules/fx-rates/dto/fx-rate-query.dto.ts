import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class FxRateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'EUR', description: 'Filter by quote currency code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  quote?: string;
}
