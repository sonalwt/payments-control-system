import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delegation } from './delegation.entity';
import { DelegationsService } from './delegations.service';
import { DelegationsController } from './delegations.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Delegation]), NotificationsModule],
  providers: [DelegationsService],
  controllers: [DelegationsController],
})
export class DelegationsModule {}
