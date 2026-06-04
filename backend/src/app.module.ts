import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import s3Config from './config/s3.config';
import mailConfig from './config/mail.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { LegalEntitiesModule } from './modules/legal-entities/legal-entities.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { CountriesModule } from './modules/countries/countries.module';
import { AccountTypesModule } from './modules/account-types/account-types.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { BanksModule } from './modules/banks/banks.module';
import { PaymentTypesModule } from './modules/payment-types/payment-types.module';
import { PaymentCategoriesModule } from './modules/payment-categories/payment-categories.module';
import { CounterpartiesModule } from './modules/counterparties/counterparties.module';
import { ApprovalMatricesModule } from './modules/approval-matrices/approval-matrices.module';
import { BeneficiaryAccountsModule } from './modules/beneficiary-accounts/beneficiary-accounts.module';
import { PaymentRequestsModule } from './modules/payment-requests/payment-requests.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, s3Config],
      load: [appConfig, databaseConfig, jwtConfig, mailConfig],
      cache: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: true,
        redact: ['req.headers.authorization'],
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow('database'),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    UserRolesModule,
    LegalEntitiesModule,
    CurrenciesModule,
    CountriesModule,
    AccountTypesModule,
    BankAccountsModule,
    EmployeesModule,
    BanksModule,
    PaymentTypesModule,
    PaymentCategoriesModule,
    CounterpartiesModule,
    ApprovalMatricesModule,
    BeneficiaryAccountsModule,
    PaymentRequestsModule,
    UploadsModule,
    AuditModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
