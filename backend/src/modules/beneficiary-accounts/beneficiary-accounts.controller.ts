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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  BeneficiaryAccountsService,
  BeneficiaryAccountQuery,
} from './beneficiary-accounts.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { VerifyChangeRequestDto } from './dto/verify-change-request.dto';
import { ApproveChangeRequestDto, RejectChangeRequestDto } from './dto/action-change-request.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('beneficiary-accounts')
export class BeneficiaryAccountsController {
  constructor(private readonly service: BeneficiaryAccountsService) {}

  // -----------------------------------------------------------------------
  // Beneficiary Accounts
  // -----------------------------------------------------------------------

  @Get()
  findAll(@Query() query: BeneficiaryAccountQuery) {
    return this.service.findAllAccounts(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneAccount(id);
  }

  /** §6.3 — Admin activates a PENDING_ACTIVATION account after cooling-off. */
  @Post(':id/activate')
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.activate(id, user.id);
  }

  // -----------------------------------------------------------------------
  // Change Requests
  // -----------------------------------------------------------------------

  @Post('change-requests')
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
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyChangeRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.verify(id, dto, user.id);
  }

  @Post('change-requests/:id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveChangeRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, dto, user.id);
  }

  @Post('change-requests/:id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectChangeRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, dto, user.id);
  }
}
