import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { UserEntityRolesModule } from './modules/user-entity-roles/user-entity-roles.module';
import { GroupsModule } from './modules/groups/groups.module';
import { LegalEntitiesModule } from './modules/legal-entities/legal-entities.module';
import { CountriesModule } from './modules/countries/countries.module';
import { BusinessUnitsModule } from './modules/business-units/business-units.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { FxRatesModule } from './modules/fx-rates/fx-rates.module';
import { BanksModule } from './modules/banks/banks.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { CrossCurrencyModule } from './modules/cross-currency/cross-currency.module';
import { PaymentTypesModule } from './modules/payment-types/payment-types.module';
import { CounterpartiesModule } from './modules/counterparties/counterparties.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ApprovalMatricesModule } from './modules/approval-matrices/approval-matrices.module';
import { SanctionedCountriesModule } from './modules/sanctioned-countries/sanctioned-countries.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { PaymentRequestsModule } from './modules/payment-requests/payment-requests.module';
import { BeneficiaryAccountsModule } from './modules/beneficiary-accounts/beneficiary-accounts.module';
import { ExceptionReportsModule } from './modules/exception-reports/exception-reports.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatementUploadsModule } from './modules/statement-uploads/statement-uploads.module';
import { PayrollBatchesModule } from './modules/payroll-batches/payroll-batches.module';
import { EmployeeBankAccountChangesModule } from './modules/employee-bank-account-changes/employee-bank-account-changes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
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
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    UserEntityRolesModule,
    GroupsModule,
    LegalEntitiesModule,
    CountriesModule,
    BusinessUnitsModule,
    DepartmentsModule,
    CurrenciesModule,
    FxRatesModule,
    BanksModule,
    BankAccountsModule,
    CrossCurrencyModule,
    PaymentTypesModule,
    CounterpartiesModule,
    EmployeesModule,
    ApprovalMatricesModule,
    SanctionedCountriesModule,
    AuditLogsModule,
    NotificationsModule,
    PaymentRequestsModule,
    BeneficiaryAccountsModule,
    ExceptionReportsModule,
    StatementUploadsModule,
    UploadsModule,
    PayrollBatchesModule,
    EmployeeBankAccountChangesModule,
  ],
})
export class AppModule {}
