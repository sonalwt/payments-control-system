import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatementLine } from './statement-line.entity';
import { ReconciliationException } from './reconciliation-exception.entity';
import { StatementUpload } from '../statement-uploads/statement-upload.entity';
import { StatementCsvParser } from './statement-csv.parser';
import { ReconciliationMatcherService } from './reconciliation-matcher.service';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationExceptionsService } from './reconciliation-exceptions.service';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationExceptionsController } from './reconciliation-exceptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StatementLine, ReconciliationException, StatementUpload]),
  ],
  controllers: [ReconciliationController, ReconciliationExceptionsController],
  providers: [
    StatementCsvParser,
    ReconciliationMatcherService,
    ReconciliationService,
    ReconciliationExceptionsService,
  ],
  exports: [ReconciliationService, ReconciliationExceptionsService],
})
export class ReconciliationModule {}
