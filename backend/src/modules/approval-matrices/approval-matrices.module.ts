import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalMatrix } from './approval-matrix.entity';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';
import { ApprovalMatrixStep } from './approval-matrix-step.entity';
import { ApprovalMatricesController } from './approval-matrices.controller';
import { ApprovalMatricesService } from './approval-matrices.service';
import { ApprovalMatrixRepository } from './approval-matrix.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApprovalMatrix,
      ApprovalMatrixBand,
      ApprovalMatrixStep,
    ]),
    AuditLogsModule,
  ],
  controllers: [ApprovalMatricesController],
  providers: [ApprovalMatricesService, ApprovalMatrixRepository],
  exports: [ApprovalMatricesService],
})
export class ApprovalMatricesModule {}
