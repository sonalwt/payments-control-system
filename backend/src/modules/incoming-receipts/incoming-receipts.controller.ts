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
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { IncomingReceiptsService } from './incoming-receipts.service';
import { CreateIncomingReceiptDto } from './dto/create-incoming-receipt.dto';
import { UpdateIncomingReceiptDto } from './dto/update-incoming-receipt.dto';
import { CancelIncomingReceiptDto, MarkReceivedDto } from './dto/action.dto';
import { IncomingReceiptStatus } from './incoming-receipt.entity';

/**
 * SOW §7 — Incoming Receipts.
 *
 * Role gating per §14:
 *  - Initiator (Payments Initiator) creates, edits drafts, submits, cancels own drafts.
 *  - Payments Team (Maker / Checker) marks received and may cancel.
 *  - Super Admin may do everything.
 *  - Read endpoints are open to any authenticated user (scope filtering is
 *    a §13 dashboard concern, not enforced at this layer).
 *
 * Creator-only and maker-checker rules are enforced in the service layer.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incoming-receipts')
export class IncomingReceiptsController {
  constructor(private readonly service: IncomingReceiptsService) {}

  @Post()
  @Roles(RoleCode.INITIATOR, RoleCode.SUPER_ADMIN)
  create(
    @Body() dto: CreateIncomingReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('counterpartyId') counterpartyId?: string,
  ) {
    return this.service.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status: status as IncomingReceiptStatus | undefined,
      legalEntityId,
      counterpartyId,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(RoleCode.INITIATOR, RoleCode.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncomingReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(RoleCode.INITIATOR, RoleCode.SUPER_ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.remove(id, user);
  }

  /** §7.2 — DRAFT → AWAITING_RECEIPT. Initiator action. */
  @Post(':id/submit')
  @Roles(RoleCode.INITIATOR, RoleCode.SUPER_ADMIN)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.submit(id, user);
  }

  /** §7.3 — AWAITING_RECEIPT → RECEIVED. Payments-team action; subject to
   *  the maker-checker rule (the user marking received cannot be the user
   *  who created the receipt). */
  @Post(':id/mark-received')
  @Roles(RoleCode.PAYMENTS_MAKER, RoleCode.PAYMENTS_CHECKER, RoleCode.SUPER_ADMIN)
  markReceived(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkReceivedDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.markReceived(id, user, dto);
  }

  /** Cancel may be initiated by the creator (initiator) or by the payments
   *  team if document review fails. Super Admin always permitted. */
  @Post(':id/cancel')
  @Roles(
    RoleCode.INITIATOR,
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.SUPER_ADMIN,
  )
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelIncomingReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancel(id, user, dto);
  }

  @Get(':id/documents')
  getDocuments(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getDocuments(id);
  }
}
