import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExceptionReportsService } from './exception-reports.service';

@UseGuards(JwtAuthGuard)
@Controller('exception-reports')
export class ExceptionReportsController {
  constructor(private readonly svc: ExceptionReportsService) {}

  /** List all reports, newest first. */
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const { data, total } = await this.svc.findAll(Number(page), Number(limit));
    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  /** Manually trigger generation for a given date (YYYY-MM-DD). Useful for testing. */
  @Post('generate/:date')
  generate(@Param('date') date: string) {
    return this.svc.generateForDate(date);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }
}
