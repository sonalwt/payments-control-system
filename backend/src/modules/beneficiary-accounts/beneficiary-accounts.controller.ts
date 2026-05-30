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
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.CHECKER, RoleCode.APPROVER_1, RoleCode.APPROVER_2)
  listChangeRequests(@Query() query: PaginationQueryDto & { status?: string }) {
    return this.service.listChangeRequests(query);
  }

  @Get('change-requests/:id')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.CHECKER, RoleCode.APPROVER_1, RoleCode.APPROVER_2)
  findChangeRequest(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findChangeRequest(id);
  }

  @Post('change-requests')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.INITIATOR)
  createChangeRequest(
    @Body() dto: CreateChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createChangeRequest(dto, user.id);
  }

  @Post('change-requests/:id/verify')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.CHECKER)
  verifyChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VerifyChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.verifyChangeRequest(id, dto, user.id);
  }

  @Post('change-requests/:id/approve')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.APPROVER_2)
  approveChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approveChangeRequest(id, dto, user.id);
  }

  @Post('change-requests/:id/reject')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.CHECKER, RoleCode.APPROVER_2)
  rejectChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.rejectChangeRequest(id, dto, user.id);
  }

  @Post('change-requests/:id/cancel')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.INITIATOR)
  cancelChangeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancelChangeRequest(id, user.id);
  }
}
