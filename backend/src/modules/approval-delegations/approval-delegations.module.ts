import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalDelegation } from './approval-delegation.entity';
import { ApprovalDelegationsController } from './approval-delegations.controller';
import { ApprovalDelegationsService } from './approval-delegations.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalDelegation])],
  controllers: [ApprovalDelegationsController],
  providers: [ApprovalDelegationsService],
  exports: [ApprovalDelegationsService],
})
export class ApprovalDelegationsModule {}
