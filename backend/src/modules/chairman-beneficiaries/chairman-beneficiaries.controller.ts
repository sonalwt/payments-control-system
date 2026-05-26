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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ChairmanBeneficiariesService,
  ChairmanBeneficiaryQuery,
} from './chairman-beneficiaries.service';
import { CreateChairmanCrDto } from './dto/create-chairman-cr.dto';
import { VerifyChairmanCrDto } from './dto/verify-chairman-cr.dto';
import {
  ApproveChairmanCrDto,
  RejectChairmanCrDto,
} from './dto/action-chairman-cr.dto';
import { ChairmanOverrideCoolingOffDto } from './dto/override-cooling-off.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chairman-beneficiaries')
export class ChairmanBeneficiariesController {
  constructor(private readonly service: ChairmanBeneficiariesService) {}

  // ── Beneficiary Accounts ───────────────────────────────────────────────────

  @Get()
  @Roles(
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  findAll(@Query() query: ChairmanBeneficiaryQuery) {
    return this.service.findAllAccounts(query);
  }

  @Get(':id')
  @Roles(
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneAccount(id);
  }

  /** §9 — Activate a PENDING_ACTIVATION beneficiary after cooling-off elapses. */
  @Post(':id/activate')
  @Roles(
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.activate(id, user.id);
  }

  /** §9 — Admin force-activates, bypassing remaining cooling-off window. */
  @Post(':id/override-cooling-off')
  @Roles(RoleCode.SYSTEM_ADMIN, RoleCode.SUPER_ADMIN)
  overrideCoolingOff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChairmanOverrideCoolingOffDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.overrideCoolingOff(id, dto, user.id);
  }

  // ── Change Requests ────────────────────────────────────────────────────────

  /** §9 — CHAIRMAN submits a new beneficiary change request. */
  @Post('change-requests')
  @Roles(RoleCode.CHAIRMAN, RoleCode.SUPER_ADMIN)
  createChangeRequest(
    @Body() dto: CreateChairmanCrDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createChangeRequest(dto, user.id);
  }

  @Get('change-requests')
  @Roles(
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  findAllChangeRequests(@Query() query: PaginationQueryDto) {
    return this.service.findAllChangeRequests(query);
  }

  @Get('change-requests/:id')
  @Roles(
    RoleCode.CHAIRMAN,
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  findOneChangeRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneChangeRequest(id);
  }

  @Post('change-requests/:id/verify')
  @Roles(RoleCode.PAYMENTS_CHECKER, RoleCode.SUPER_ADMIN)
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyChairmanCrDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.verify(id, dto, user.id);
  }

  @Post('change-requests/:id/approve')
  @Roles(RoleCode.PAYMENTS_HEAD, RoleCode.SUPER_ADMIN)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveChairmanCrDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, dto, user.id);
  }

  @Post('change-requests/:id/reject')
  @Roles(
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectChairmanCrDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, dto, user.id);
  }

  /** §9 — Cancel a PENDING_VERIFICATION or VERIFIED change request. */
  @Post('change-requests/:id/cancel')
  @Roles(
    RoleCode.CHAIRMAN,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, user.id);
  }
}
