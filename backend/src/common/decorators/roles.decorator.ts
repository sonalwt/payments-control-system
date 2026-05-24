import { SetMetadata } from '@nestjs/common';
import { RoleCode } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Marks the route as requiring at least one of the given roles.
 * Used by `RolesGuard`. Example:
 *   @Roles(RoleCode.SUPER_ADMIN)
 */
export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);
