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
import { ReconciliationService } from './reconciliation.service';
import {
  ExceptionQueryDto,
  InvestigateDto,
  ResolveExceptionDto,
} from './dto/reconciliation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Reconciliation Exceptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.SUPER_ADMIN)
@Controller('reconciliation-exceptions')
export class ReconciliationExceptionsController {
  constructor(private readonly service: ReconciliationService) {}

  @Get()
  findAll(@Query() query: ExceptionQueryDto) {
    return this.service.findExceptions(query);
  }

  @Post(':id/start-investigation')
  startInvestigation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: InvestigateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.startInvestigation(id, dto, user.id);
  }

  @Post(':id/resolve')
  resolve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolveExceptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.resolveException(id, dto, user.id);
  }

  @Post(':id/confirm')
  confirm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolveExceptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.confirmException(id, dto, user.id);
  }
}
