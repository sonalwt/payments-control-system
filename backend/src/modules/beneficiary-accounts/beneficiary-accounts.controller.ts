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
  BeneficiaryAccountsService,
  BeneficiaryAccountQuery,
} from './beneficiary-accounts.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { VerifyChangeRequestDto } from './dto/verify-change-request.dto';
import { ApproveChangeRequestDto, RejectChangeRequestDto } from './dto/action-change-request.dto';
import { CopyFromVerifiedDto } from './dto/copy-from-verified.dto';
import { OverrideCoolingOffDto } from './dto/override-cooling-off.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('beneficiary-accounts')
export class BeneficiaryAccountsController {
  constructor(private readonly service: BeneficiaryAccountsService) {}

  // ── Beneficiary Accounts ───────────────────────────────────────────────────

  @Get()
  findAll(@Query() query: BeneficiaryAccountQuery) {
    return this.service.findAllAccounts(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneAccount(id);
  }

  /** §6.3 — Activate a PENDING_ACTIVATION account after the cooling-off window elapses. */
  @Post(':id/activate')
  @Roles(
    RoleCode.BENEFICIARY_CHANGE_VERIFIER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.SYSTEM_ADMIN,
    RoleCode.SUPER_ADMIN,
  )
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.activate(id, user.id);
  }

  /** §6.3 — Admin force-activates, bypassing remaining cooling-off; override logged. */
  @Post(':id/override-cooling-off')
  @Roles(RoleCode.SYSTEM_ADMIN, RoleCode.SUPER_ADMIN)
  overrideCoolingOff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OverrideCoolingOffDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.overrideCoolingOff(id, dto, user.id);
  }

  /** §6.3 — Copy an ACTIVE verified account to a new owner; no cooling-off. */
  @Post(':id/copy')
  @Roles(
    RoleCode.BENEFICIARY_CHANGE_MAKER,
    RoleCode.INITIATOR,
    RoleCode.PAYMENTS_MAKER,
    RoleCode.SUPER_ADMIN,
  )
  copyFromVerified(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CopyFromVerifiedDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.copyFromVerified(id, dto, user.id);
  }

  // ── Change Requests ────────────────────────────────────────────────────────

  @Post('change-requests')
  @Roles(
    RoleCode.BENEFICIARY_CHANGE_MAKER,
    RoleCode.INITIATOR,
    RoleCode.HR_INITIATOR,
    RoleCode.PAYMENTS_MAKER,
    RoleCode.SUPER_ADMIN,
  )
  createChangeRequest(
    @Body() dto: CreateChangeRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createChangeRequest(dto, user.id);
  }

  @Get('change-requests')
  findAllChangeRequests(@Query() query: PaginationQueryDto) {
    return this.service.findAllChangeRequests(query);
  }

  @Get('change-requests/:id')
  findOneChangeRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneChangeRequest(id);
  }

  @Post('change-requests/:id/verify')
  @Roles(
    RoleCode.BENEFICIARY_CHANGE_VERIFIER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.SUPER_ADMIN,
  )
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyChangeRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.verify(id, dto, user.id);
  }

  @Post('change-requests/:id/approve')
  @Roles(
    RoleCode.APPROVER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.FINANCE_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveChangeRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, dto, user.id);
  }

  @Post('change-requests/:id/reject')
  @Roles(
    RoleCode.BENEFICIARY_CHANGE_VERIFIER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.APPROVER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.FINANCE_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectChangeRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, dto, user.id);
  }

  /** §6.2 — Cancel a PENDING_VERIFICATION or VERIFIED change request. */
  @Post('change-requests/:id/cancel')
  @Roles(
    RoleCode.BENEFICIARY_CHANGE_MAKER,
    RoleCode.INITIATOR,
    RoleCode.HR_INITIATOR,
    RoleCode.PAYMENTS_MAKER,
    RoleCode.SYSTEM_ADMIN,
    RoleCode.SUPER_ADMIN,
  )
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, user.id);
  }
}
