import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ReconciliationService } from './reconciliation.service';
import { IngestCsvDto, IngestManualDto } from './dto/ingest.dto';
import { ConfirmMatchDto, UnmatchLineDto } from './dto/match.dto';

const MAKER = [RoleCode.PAYMENTS_MAKER, RoleCode.FINANCE_HEAD, RoleCode.SUPER_ADMIN];
const VIEW = [
  RoleCode.PAYMENTS_MAKER,
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.FINANCE_HEAD,
  RoleCode.SUPER_ADMIN,
];

/**
 * SOW §8.1 / §8.2 — Reconciliation endpoints. These live under their own
 * /reconciliation path so the existing /statement-uploads CRUD is left
 * exactly as-is.
 */
@ApiTags('reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Post('uploads/:uploadId/ingest-csv')
  @Roles(...MAKER)
  ingestCsv(
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @Body() dto: IngestCsvDto,
  ) {
    return this.service.ingestCsv(uploadId, dto);
  }

  @Post('uploads/:uploadId/ingest-manual')
  @Roles(...MAKER)
  ingestManual(
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @Body() dto: IngestManualDto,
  ) {
    return this.service.ingestManual(uploadId, dto);
  }

  @Post('uploads/:uploadId/rerun-matcher')
  @Roles(...MAKER)
  rerun(@Param('uploadId', ParseUUIDPipe) uploadId: string) {
    return this.service.rerunMatcher(uploadId);
  }

  @Get('uploads/:uploadId/lines')
  @Roles(...VIEW)
  listLines(@Param('uploadId', ParseUUIDPipe) uploadId: string) {
    return this.service.listLines(uploadId);
  }

  @Post('lines/:lineId/confirm-match')
  @Roles(...MAKER)
  confirm(
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() dto: ConfirmMatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.confirmMatch(lineId, dto, user.id);
  }

  @Post('lines/:lineId/unmatch')
  @Roles(...MAKER)
  unmatch(
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() dto: UnmatchLineDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.unmatchLine(lineId, dto, user.id);
  }
}
