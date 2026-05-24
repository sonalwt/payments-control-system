import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntityRole } from './user-entity-role.entity';
import { UserEntityRolesController } from './user-entity-roles.controller';
import { UserEntityRolesService } from './user-entity-roles.service';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntityRole, User, Role, LegalEntity]),
    AuditLogsModule,
  ],
  controllers: [UserEntityRolesController],
  providers: [UserEntityRolesService],
  exports: [UserEntityRolesService],
})
export class UserEntityRolesModule {}
