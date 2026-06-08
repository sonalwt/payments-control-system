import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** The authenticated principal on the employee self-service portal. Unlike
 *  AuthenticatedUser it carries no roles — employees have no staff privileges. */
export interface AuthenticatedEmployee {
  id: string;
  workEmail: string;
  fullName: string;
  legalEntityId: string | null;
}

export const CurrentEmployee = createParamDecorator(
  (data: keyof AuthenticatedEmployee | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const employee = request.user as AuthenticatedEmployee;
    return data ? employee?.[data] : employee;
  },
);
