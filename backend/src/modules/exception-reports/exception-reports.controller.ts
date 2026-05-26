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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { ExceptionReportsService } from './exception-reports.service';

// §4.4 — Proof-of-payment exception reports default to the Country Finance
// Head. §13 dashboards also expose them to the Payments Team, Treasurer, and
// Internal Auditor (read-only).
const VIEW = [
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.FINANCE_HEAD,
  RoleCode.GROUP_TREASURER,
  RoleCode.INTERNAL_AUDITOR,
  RoleCode.SYSTEM_ADMIN,
  RoleCode.SUPER_ADMIN,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exception-reports')
export class ExceptionReportsController {
  constructor(private readonly svc: ExceptionReportsService) {}

  /** List all reports, newest first. */
  @Get()
  @Roles(...VIEW)
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
  @Roles(RoleCode.SYSTEM_ADMIN, RoleCode.SUPER_ADMIN)
  generate(@Param('date') date: string) {
    return this.svc.generateForDate(date);
  }

  @Get(':id')
  @Roles(...VIEW)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }
}
