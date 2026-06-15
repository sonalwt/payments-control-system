import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const upper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

/** Filters for listing recorded FX rates. */
export class QueryFxRateDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'EUR', description: 'Filter by quote currency' })
  @IsOptional()
  @Transform(upper)
  @IsString()
  @Length(3, 3)
  quote?: string;

  @ApiPropertyOptional({ example: 'USD', description: 'Filter by base currency' })
  @IsOptional()
  @Transform(upper)
  @IsString()
  @Length(3, 3)
  base?: string;
}
