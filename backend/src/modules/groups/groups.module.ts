import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupRepository } from './group.repository';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group, LegalEntity]), AuditLogsModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupRepository],
  exports: [GroupsService],
})
export class GroupsModule {}
