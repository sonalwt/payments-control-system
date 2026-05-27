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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentRequestsService } from './payment-requests.service';
import { CreatePaymentRequestDto, DocumentAttachmentDto } from './dto/create-payment-request.dto';
import { UpdatePaymentRequestDto } from './dto/update-payment-request.dto';
import {
  ApprovePaymentRequestDto,
  CancelPaymentRequestDto,
  MarkPaidDto,
  RejectPaymentRequestDto,
  ReleasePaymentRequestDto,
  WithdrawPaymentRequestDto,
} from './dto/action.dto';
import { ChairmanApproveDto, ChairmanPrepareDto, ChairmanVerifyDto } from './dto/chairman-action.dto';
import { PaymentRequestStatus } from './payment-request.entity';

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payment-requests')
export class PaymentRequestsController {
  constructor(private readonly service: PaymentRequestsService) {}

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  /** Create a new payment request in DRAFT status. */
  @Post()
  @Roles(
    RoleCode.INITIATOR,
    RoleCode.HR_INITIATOR,
    RoleCode.CHAIRMAN,
    RoleCode.SUPER_ADMIN,
  )
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
    @Query('isChairmanPayment') isChairmanPayment?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.service.findAll(
      {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search,
        status: status as PaymentRequestStatus | undefined,
        paymentTypeCode,
        legalEntityId,
        counterpartyId,
        employeeId,
        isChairmanPayment: isChairmanPayment as 'true' | 'false' | undefined,
      },
      user?.roles ?? [],
    );
  }

  /** Get a single payment request with all relations. */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.service.findOne(id, user?.roles ?? []);
  }

  /** Update a DRAFT payment request. */
  @Put(':id')
  @Roles(
    RoleCode.INITIATOR,
    RoleCode.HR_INITIATOR,
    RoleCode.CHAIRMAN,
    RoleCode.SUPER_ADMIN,
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  /** Soft-delete a DRAFT payment request. */
  @Delete(':id')
  @Roles(
    RoleCode.INITIATOR,
    RoleCode.HR_INITIATOR,
    RoleCode.CHAIRMAN,
    RoleCode.SUPER_ADMIN,
  )
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
  @Roles(
    RoleCode.INITIATOR,
    RoleCode.HR_INITIATOR,
    RoleCode.CHAIRMAN,
    RoleCode.SUPER_ADMIN,
  )
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.submit(id, user.id);
  }

  /** Approve the current pending step (for the designated approver). */
  @Post(':id/approve')
  @Roles(
    RoleCode.APPROVER,
    RoleCode.PAYROLL_APPROVER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.FINANCE_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, user.id, dto);
  }

  /** Reject the request at the current step. */
  @Post(':id/reject')
  @Roles(
    RoleCode.APPROVER,
    RoleCode.PAYROLL_APPROVER,
    RoleCode.PAYMENTS_HEAD,
    RoleCode.FINANCE_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, user.id, dto);
  }

  /** Requester withdraws a non-terminal request. */
  @Post(':id/withdraw')
  @Roles(
    RoleCode.INITIATOR,
    RoleCode.HR_INITIATOR,
    RoleCode.CHAIRMAN,
    RoleCode.SUPER_ADMIN,
  )
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawPaymentRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.withdraw(id, user.id, dto);
  }

  /** Admin cancels a non-terminal request. */
  @Post(':id/cancel')
  @Roles(RoleCode.SYSTEM_ADMIN, RoleCode.SUPER_ADMIN)
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
  @Roles(RoleCode.PAYMENTS_MAKER, RoleCode.SUPER_ADMIN)
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
  @Roles(RoleCode.PAYMENTS_MAKER, RoleCode.SUPER_ADMIN)
  markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.markPaid(id, user.id, dto);
  }

  // -----------------------------------------------------------------------
  // §9 — Chairman payment lifecycle
  // -----------------------------------------------------------------------

  /**
   * DRAFT → AWAITING_MAKER_PREP.
   * Skips the approval matrix entirely; only valid on chairman payment requests.
   */
  @Post(':id/chairman-submit')
  @Roles(RoleCode.CHAIRMAN, RoleCode.SUPER_ADMIN)
  chairmanSubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.chairmanSubmit(id, user.id);
  }

  /**
   * AWAITING_MAKER_PREP → AWAITING_CHECKER_REVIEW.
   * Payments Maker selects a chairman-designated source account.
   */
  @Post(':id/chairman-prepare')
  @Roles(RoleCode.PAYMENTS_MAKER, RoleCode.SUPER_ADMIN)
  chairmanPrepare(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChairmanPrepareDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.chairmanPrepare(id, user.id, dto);
  }

  /**
   * AWAITING_CHECKER_REVIEW → AWAITING_HEAD_APPROVAL.
   * Payments Checker verifies documents (different person from Maker).
   */
  @Post(':id/chairman-verify')
  @Roles(RoleCode.PAYMENTS_CHECKER, RoleCode.SUPER_ADMIN)
  chairmanVerify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChairmanVerifyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.chairmanVerify(id, user.id, dto);
  }

  /**
   * AWAITING_HEAD_APPROVAL → AWAITING_PAYMENT_CONFIRMATION.
   * Payments Head gives final execution approval.
   */
  @Post(':id/chairman-approve')
  @Roles(RoleCode.PAYMENTS_HEAD, RoleCode.SUPER_ADMIN)
  chairmanApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChairmanApproveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.chairmanApprove(id, user.id, dto);
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

  /** Add a document to a DRAFT request (used when editing before submission). */
  @Post(':id/documents')
  @Roles(
    RoleCode.INITIATOR,
    RoleCode.HR_INITIATOR,
    RoleCode.CHAIRMAN,
    RoleCode.SUPER_ADMIN,
  )
  addDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DocumentAttachmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.addDocument(id, dto, user.id);
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
