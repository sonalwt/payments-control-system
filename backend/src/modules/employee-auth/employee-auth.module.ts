import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Employee } from '../employees/employee.entity';
import { EmployeeLoginOtp } from './employee-otp.entity';
import { EmployeeAuthController } from './employee-auth.controller';
import { EmployeeAuthService } from './employee-auth.service';
import { EmployeeJwtStrategy } from './employee-jwt.strategy';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, EmployeeLoginOtp]),
    PassportModule,
    // Secrets are supplied per-call in the service (employee-derived secret),
    // so no default secret is registered here.
    JwtModule.register({}),
    MailModule,
  ],
  controllers: [EmployeeAuthController],
  providers: [EmployeeAuthService, EmployeeJwtStrategy],
  exports: [EmployeeAuthService],
})
export class EmployeeAuthModule {}
