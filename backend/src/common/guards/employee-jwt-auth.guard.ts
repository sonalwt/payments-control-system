import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authenticates a request against the employee self-service realm
 * ('employee-jwt' strategy). Applied only on @EmployeeAuth() routes; the
 * global user guards defer to it there.
 */
@Injectable()
export class EmployeeJwtAuthGuard extends AuthGuard('employee-jwt') {}
