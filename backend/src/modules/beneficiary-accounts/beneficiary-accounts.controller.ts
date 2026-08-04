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
import { BeneficiaryAccountsService } from './beneficiary-accounts.service';
import {
  ApproveChangeRequestDto,
  CreateChangeRequestDto,
  RejectChangeRequestDto,
  VerifyChangeRequestDto,
} from './dto/create-change-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Beneficiary Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('beneficiary-accounts')
export class BeneficiaryAccountsController {
  constructor(private readonly service: BeneficiaryAccountsService) {}

  // -------------------------------------------------------------------
  // Beneficiary account reads — open to operational roles so that the
  // payment-request form can populate its destination dropdown.
  // -------------------------------------------------------------------

  @Get()
  @Roles()
  findAll(
    @Query()
    query: PaginationQueryDto & {
      counterpartyId?: string;
      employeeId?: string;
      status?: string;
      payableOnly?: string;
    },
  ) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles()
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  // -------------------------------------------------------------------
  // Change-request workflow
  // -------------------------------------------------------------------

  @Get('change-requests/list')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.KYC_TEAM)
  listChangeRequests(
    @Query() query: PaginationQueryDto & { status?: string; beneficiaryAccountId?: string },
  ) {
    return this.service.listChangeRequests(query);
  }

  @Get('change-requests/:id')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.KYC_TEAM)
  findChangeRequest(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findChangeRequest(id);
  }

  // Raising a beneficiary change request is the payment maker's job. Maker
  // eligibility is data-driven (not a role), so the guard is opened and the
  // service enforces the real rule. Verification/approval below stays with the
  // KYC team, so the maker cannot bring their own beneficiary into use.
  @Post('change-requests')
  @Roles()
  createChangeRequest(
    @Body() dto: CreateChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createChangeRequest(dto, user);
  }

  @Post('change-requests/:id/verify')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.KYC_TEAM)
  verifyChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VerifyChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.verifyChangeRequest(id, dto, user.id);
  }

  @Post('change-requests/:id/approve')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.KYC_TEAM)
  approveChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approveChangeRequest(id, dto, user.id);
  }

  @Post('change-requests/:id/reject')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.KYC_TEAM)
  rejectChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.rejectChangeRequest(id, dto, user.id);
  }

  // Cancelling is restricted to the requester by the service itself
  // (cr.requestedBy must match the actor), so any authenticated user may call.
  @Post('change-requests/:id/cancel')
  @Roles()
  cancelChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancelChangeRequest(id, user.id);
  }
}
