import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentRequestsService } from './payment-requests.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import {
  AttachDocumentDto,
  ApproveDto,
  CancelDto,
  RejectDto,
  TreasuryCompleteDto,
  TreasuryDecisionDto,
  TreasurySubmitDto,
  TreasurySwiftDto,
  WithdrawDto,
} from './dto/action.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/**
 * Authorization model:
 *   - All endpoints require JWT authentication (JwtAuthGuard).
 *   - No hardcoded role codes are used except for cancel (SUPER_ADMIN).
 *   - approve / reject — service checks step assignment (USER or ROLE type).
 *   - treasury/* — service checks the actor holds the treasury stage role
 *     (maker role resolved from the request's TT mode).
 *   - cancel — SUPER_ADMIN only (platform-admin escalation).
 *   - findAll() visibility is role-agnostic; the service filters by
 *     created_by and current pending step assignment.
 */
@ApiTags('Payment Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payment-requests')
export class PaymentRequestsController {
  constructor(private readonly service: PaymentRequestsService) {}

  // -------- CRUD ----------------------------------------------------

  @Post()
  create(@Body() dto: CreatePaymentRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query()
    query: PaginationQueryDto & {
      status?: string;
      paymentTypeId?: string;
      activityPeriod?: 'today' | 'month' | string;
      dateFrom?: string;
      dateTo?: string;
      awaitingAction?: string;
    },
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.service.findAll(query, viewer);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePaymentRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id);
  }

  // -------- Lifecycle actions --------------------------------------

  @Post(':id/submit')
  submit(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.submit(id, user.id);
  }

  @Post(':id/approve')
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(id, dto, user.id);
  }

  @Post(':id/reject')
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(id, dto, user.id);
  }

  @Post(':id/resubmit')
  resubmit(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.resubmit(id, user.id);
  }

  @Post(':id/withdraw')
  withdraw(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: WithdrawDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.withdraw(id, dto, user.id);
  }

  // -------- Treasury Team execution (post final-approval) ----------

  @Post(':id/treasury/submit')
  treasurySubmit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TreasurySubmitDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.treasurySubmit(id, dto, user.id);
  }

  @Post(':id/treasury/check')
  treasuryCheck(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TreasuryDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.treasuryCheck(id, dto, user.id);
  }

  @Post(':id/treasury/complete')
  treasuryComplete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TreasuryCompleteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.treasuryComplete(id, dto, user.id);
  }

  @Post(':id/treasury/upload-swift')
  treasuryUploadSwift(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TreasurySwiftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.treasuryUploadSwift(id, dto, user.id);
  }

  @Post(':id/close')
  close(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.closeRequest(id, user.id);
  }

  @Post(':id/treasury/reject')
  treasuryReject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.treasuryReject(id, dto, user.id);
  }

  // -------- Document management (DRAFT only) -----------------------

  @Post(':id/documents')
  attachDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AttachDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.attachDocument(id, dto, user.id);
  }

  @Delete(':id/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.removeDocument(id, documentId, user.id);
  }

  @Post(':id/cancel')
  @Roles(RoleCode.SUPER_ADMIN)
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancel(id, dto, user.id);
  }
}
