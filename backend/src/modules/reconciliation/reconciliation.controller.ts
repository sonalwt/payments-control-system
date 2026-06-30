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
import { ReconciliationService } from './reconciliation.service';
import { ConfirmMatchDto, IngestDto, UnmatchDto } from './dto/reconciliation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.SUPER_ADMIN)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Get('uploads/:id/lines')
  getLines(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getLines(id);
  }

  @Post('uploads/:id/ingest-csv')
  ingest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: IngestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.ingestCsv(id, dto, user.id);
  }

  @Post('uploads/:id/rerun-matcher')
  rerun(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.rerunMatcher(id, user.id);
  }

  @Post('lines/:id/confirm-match')
  confirm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ConfirmMatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.confirmMatch(id, dto, user.id);
  }

  @Post('lines/:id/unmatch')
  unmatch(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UnmatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.unmatch(id, dto, user.id);
  }
}
