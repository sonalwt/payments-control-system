import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { AuthenticatedEmployee } from '../../common/decorators/current-employee.decorator';

export interface EmployeeJwtPayload {
  sub: string;
  workEmail: string;
  name: string;
  /** Marks the principal's realm; must be 'employee' for this strategy. */
  realm: 'employee';
}

/**
 * Derived from, but distinct from, the user JWT secret so an employee token
 * can never be accepted by the user 'jwt' strategy (and vice versa), even
 * before the realm claim is checked.
 */
export function employeeJwtSecret(baseSecret: string): string {
  return `${baseSecret}::employee`;
}

@Injectable()
export class EmployeeJwtStrategy extends PassportStrategy(Strategy, 'employee-jwt') {
  constructor(
    config: ConfigService,
    @InjectRepository(Employee) private readonly employees: Repository<Employee>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: employeeJwtSecret(config.getOrThrow<string>('jwt.secret')),
    });
  }

  async validate(payload: EmployeeJwtPayload): Promise<AuthenticatedEmployee> {
    if (payload.realm !== 'employee') {
      throw new UnauthorizedException('Invalid token realm');
    }
    const employee = await this.employees.findOne({ where: { id: payload.sub } });
    if (!employee || !employee.isActive) {
      throw new UnauthorizedException('Employee no longer active');
    }
    return {
      id: employee.id,
      workEmail: employee.workEmail,
      fullName: employee.fullName,
      legalEntityId: employee.legalEntityId ?? null,
    };
  }
}
