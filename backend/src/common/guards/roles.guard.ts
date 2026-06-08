import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleCode } from '../enums/role.enum';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { IS_EMPLOYEE_ROUTE_KEY } from '../decorators/employee-auth.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Employee-realm routes carry no staff roles; this guard does not apply.
    const isEmployeeRoute = this.reflector.getAllAndOverride<boolean>(IS_EMPLOYEE_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isEmployeeRoute) {
      return true;
    }
    const required = this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!user || !user.roles) {
      throw new ForbiddenException('Authentication context missing');
    }
    const ok = required.some((r) => user.roles.includes(r));
    if (!ok) {
      throw new ForbiddenException(
        `Requires one of role(s): ${required.join(', ')}`,
      );
    }
    return true;
  }
}
