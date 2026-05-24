import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentRequestsService } from './payment-requests.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import {
  ApprovePaymentRequestDto,
  CancelPaymentRequestDto,
  MarkPaidDto,
  RejectPaymentRequestDto,
  ReleasePaymentRequestDto,
  WithdrawPaymentRequestDto,
} from './dto/action.dto';
import { PaymentRequestStatus } from './payment-request.entity';

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('payment-requests')
export class PaymentRequestsController {
  constructor(private readonly service: PaymentRequestsService) {}

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  /** Create a new payment request in DRAFT status. */
  @Post()
  create(
    @Body() dto: CreatePaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.id);
  }

  /** List payment requests with optional filters. */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentTypeCode') paymentTypeCode?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('counterpartyId') counterpartyId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.service.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status: status as PaymentRequestStatus | undefined,
      paymentTypeCode,
      legalEntityId,
      counterpartyId,
      employeeId,
    });
  }

  /** Get a single payment request with all relations. */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /** Update a DRAFT payment request. */
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  /** Soft-delete a DRAFT payment request. */
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }

  // -----------------------------------------------------------------------
  // §3 — Lifecycle actions
  // -----------------------------------------------------------------------

  /** DRAFT → PENDING_APPROVAL. Resolves and pins the approval chain. */
  @Post(':id/submit')
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.submit(id, user.id);
  }

  /** Approve the current pending step (for the designated approver). */
  @Post(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, user.id, dto);
  }

  /** Reject the request at the current step. */
  @Post(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, user.id, dto);
  }

  /** Requester withdraws a non-terminal request. */
  @Post(':id/withdraw')
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawPaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.withdraw(id, user.id, dto);
  }

  /** Admin cancels a non-terminal request. */
  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelPaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, user.id, dto);
  }

  /**
   * Maker releases an APPROVED request to the bank.
   * Sets the source account and moves to AWAITING_PAYMENT_CONFIRMATION.
   */
  @Post(':id/release')
  release(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReleasePaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.release(id, user.id, dto);
  }

  /**
   * Maker captures the bank reference and moves the request to PAID.
   * Debits the source account balance (§2.5).
   */
  @Post(':id/mark-paid')
  markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.markPaid(id, user.id, dto);
  }

  // -----------------------------------------------------------------------
  // Sub-resources
  // -----------------------------------------------------------------------

  /** Approval chain history for a request. */
  @Get(':id/approvals')
  getApprovals(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getApprovals(id);
  }

  /** Documents attached to a request. */
  @Get(':id/documents')
  getDocuments(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getDocuments(id);
  }

  /**
   * §4.1 — Download the counterparty/employee data snapshot frozen at submission.
   * Returns the JSONB snapshot that was captured when the request was submitted.
   */
  @Get(':id/counterparty-snapshot')
  getCounterpartySnapshot(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getCounterpartySnapshot(id);
  }
}
