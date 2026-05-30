import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class UsersQueryDto extends PaginationQueryDto {
  /**
   * Filters the user list to those holding the given role code
   * (e.g. APPROVER, COUNTERPARTY). Looked up via user_roles -> roles.code.
   */
  @ApiPropertyOptional({ example: 'APPROVER' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'roleCode must be UPPER_SNAKE_CASE' })
  roleCode?: string;
}
