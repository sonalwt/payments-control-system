import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserEntityRoleDto } from './create-user-entity-role.dto';

export class UpdateUserEntityRoleDto extends PartialType(
  OmitType(CreateUserEntityRoleDto, ['userId', 'legalEntityId', 'roleId'] as const),
) {}
