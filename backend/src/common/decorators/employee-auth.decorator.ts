import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeJwtAuthGuard } from '../guards/employee-jwt-auth.guard';

/** Metadata flag marking a route as belonging to the employee realm. The
 *  global user JwtAuthGuard and RolesGuard read this and defer, so an
 *  employee token is validated only by EmployeeJwtAuthGuard (and a user
 *  token is never accepted here). */
export const IS_EMPLOYEE_ROUTE_KEY = 'isEmployeeRoute';

/**
 * Protect a route with the employee self-service realm. Replaces the staff
 * @UseGuards(JwtAuthGuard, RolesGuard) on a per-route basis.
 */
export function EmployeeAuth() {
  return applyDecorators(
    SetMetadata(IS_EMPLOYEE_ROUTE_KEY, true),
    UseGuards(EmployeeJwtAuthGuard),
    ApiBearerAuth(),
  );
}
