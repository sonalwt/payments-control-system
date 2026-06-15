import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_EMPLOYEE_ROUTE_KEY } from '../decorators/employee-auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    // Employee-realm routes are authenticated by EmployeeJwtAuthGuard; the
    // user 'jwt' strategy must not try (and reject) an employee token here.
    const isEmployeeRoute = this.reflector.getAllAndOverride<boolean>(IS_EMPLOYEE_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isEmployeeRoute) {
      return true;
    }
    return super.canActivate(context);
  }
}
