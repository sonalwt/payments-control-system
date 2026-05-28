import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { LegalEntitiesModule } from './modules/legal-entities/legal-entities.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { CountriesModule } from './modules/countries/countries.module';
import { AccountTypesModule } from './modules/account-types/account-types.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { BanksModule } from './modules/banks/banks.module';

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
    AuthModule,
    UsersModule,
    RolesModule,
    UserRolesModule,
    LegalEntitiesModule,
    CurrenciesModule,
    CountriesModule,
    AccountTypesModule,
    BankAccountsModule,
    DepartmentsModule,
    EmployeesModule,
    BanksModule,
  ],
})
export class AppModule {}
