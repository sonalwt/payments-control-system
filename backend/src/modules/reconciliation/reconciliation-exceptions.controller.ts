import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { ReconciliationExceptionsService } from './reconciliation-exceptions.service';
import {
  ConfirmExceptionDto,
  ResolveExceptionDto,
  StartInvestigationDto,
} from './dto/exception-action.dto';
import {
  ReconciliationExceptionStatus,
  ReconciliationExceptionType,
} from './reconciliation-exception.entity';

// §8.3 — exceptions are routed to "a configured group of senior users"; the
// Group Treasurer / CFO is the §13 recipient group for reconciliation
// exceptions. Internal Auditor and System Admin retain read access only.
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
const ACT = [
  RoleCode.PAYMENTS_CHECKER,
  RoleCode.PAYMENTS_HEAD,
  RoleCode.FINANCE_HEAD,
  RoleCode.GROUP_TREASURER,
  RoleCode.SUPER_ADMIN,
];

@ApiTags('reconciliation-exceptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reconciliation-exceptions')
export class ReconciliationExceptionsController {
  constructor(private readonly service: ReconciliationExceptionsService) {}

  @Get()
  @Roles(...VIEW)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('exceptionType') exceptionType?: string,
    @Query('bankAccountId') bankAccountId?: string,
    @Query('statementUploadId') statementUploadId?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.service.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status: status as ReconciliationExceptionStatus | undefined,
      exceptionType: exceptionType as ReconciliationExceptionType | undefined,
      bankAccountId,
      statementUploadId,
      userRoles: user?.roles ?? [],
    });
  }

  @Get(':id')
  @Roles(...VIEW)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/start-investigation')
  @Roles(...ACT)
  startInvestigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartInvestigationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.startInvestigation(id, dto, user.id);
  }

  @Post(':id/resolve')
  @Roles(...ACT)
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveExceptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.resolve(id, dto, user.id);
  }

  @Post(':id/confirm')
  @Roles(
    RoleCode.FINANCE_HEAD,
    RoleCode.GROUP_TREASURER,
    RoleCode.SUPER_ADMIN,
  )
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmExceptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.confirm(id, dto, user.id);
  }
}
