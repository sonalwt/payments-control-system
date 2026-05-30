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
  ApproveDto,
  CancelDto,
  MarkPaidDto,
  RejectDto,
  ReleaseDto,
  UploadProofDto,
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
 * Authorization model after the role reset:
 *   - CRUD on drafts, list/get, submit, withdraw — open to any
 *     authenticated user (the service enforces ownership / business
 *     rules; maker eligibility is checked at submit).
 *   - approve / reject — SUPER_ADMIN or any user holding APPROVER.
 *   - release / mark-paid / upload-proof — SUPER_ADMIN or APPROVER
 *     (payments-team Maker functions; relaxed to APPROVER until a
 *     dedicated treasury role is reintroduced).
 *   - cancel — SUPER_ADMIN only.
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
      legalEntityId?: string;
      paymentTypeId?: string;
    },
  ) {
    return this.service.findAll(query);
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
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.APPROVER)
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(id, dto, user.id);
  }

  @Post(':id/reject')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.APPROVER)
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(id, dto, user.id);
  }

  @Post(':id/withdraw')
  withdraw(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: WithdrawDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.withdraw(id, dto, user.id);
  }

  @Post(':id/release')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.APPROVER)
  release(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReleaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.release(id, dto, user.id);
  }

  @Post(':id/mark-paid')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.APPROVER)
  markPaid(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.markPaid(id, dto, user.id);
  }

  @Post(':id/upload-proof')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.APPROVER)
  uploadProof(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UploadProofDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.uploadProof(id, dto, user.id);
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
