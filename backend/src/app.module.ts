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
import { UserEntityRolesModule } from './modules/user-entity-roles/user-entity-roles.module';
import { GroupsModule } from './modules/groups/groups.module';
import { LegalEntitiesModule } from './modules/legal-entities/legal-entities.module';
import { CountriesModule } from './modules/countries/countries.module';
import { BusinessUnitsModule } from './modules/business-units/business-units.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

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
    UserEntityRolesModule,
    GroupsModule,
    LegalEntitiesModule,
    CountriesModule,
    BusinessUnitsModule,
    DepartmentsModule,
    CurrenciesModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
