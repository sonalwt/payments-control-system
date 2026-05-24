import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionReport } from './exception-report.entity';
import { ExceptionReportItem } from './exception-report-item.entity';
import { ExceptionReportsService } from './exception-reports.service';
import { ExceptionReportsController } from './exception-reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExceptionReport, ExceptionReportItem])],
  providers: [ExceptionReportsService],
  controllers: [ExceptionReportsController],
})
export class ExceptionReportsModule {}
