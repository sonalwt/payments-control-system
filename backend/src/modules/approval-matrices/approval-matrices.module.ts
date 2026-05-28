import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalMatrix } from './approval-matrix.entity';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';
import { ApprovalMatrixStep } from './approval-matrix-step.entity';
import { ApprovalMatricesController } from './approval-matrices.controller';
import { ApprovalMatricesService } from './approval-matrices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApprovalMatrix, ApprovalMatrixBand, ApprovalMatrixStep]),
  ],
  controllers: [ApprovalMatricesController],
  providers: [ApprovalMatricesService],
  exports: [ApprovalMatricesService, TypeOrmModule],
})
export class ApprovalMatricesModule {}
