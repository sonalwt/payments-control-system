import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import s3Config from './config/s3.config';
import mailConfig from './config/mail.config';
import fxConfig from './config/fx.config';

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
import { ApprovalDelegationsModule } from './modules/approval-delegations/approval-delegations.module';
import { BeneficiaryAccountsModule } from './modules/beneficiary-accounts/beneficiary-accounts.module';
import { PaymentRequestsModule } from './modules/payment-requests/payment-requests.module';
import { IncomingReceiptsModule } from './modules/incoming-receipts/incoming-receipts.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AuditModule } from './modules/audit/audit.module';
<<<<<<< HEAD
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DelegationsModule } from './modules/delegations/delegations.module';
=======
import { EmployeeAuthModule } from './modules/employee-auth/employee-auth.module';
import { EmployeePortalModule } from './modules/employee-portal/employee-portal.module';
import { FxRatesModule } from './modules/fx-rates/fx-rates.module';
import { PaymentRequestMessagesModule } from './modules/payment-request-messages/payment-request-messages.module';
>>>>>>> 43099abedf021798bdb1c81e5b1414483aa71996

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, s3Config, mailConfig, fxConfig],
      cache: true,
    }),
    ScheduleModule.forRoot(),
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
    ApprovalDelegationsModule,
    BeneficiaryAccountsModule,
    PaymentRequestsModule,
    IncomingReceiptsModule,
    ReconciliationModule,
    UploadsModule,
    AuditModule,
    NotificationsModule,
    DelegationsModule,
    EmployeeAuthModule,
    EmployeePortalModule,
    FxRatesModule,
    PaymentRequestMessagesModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
