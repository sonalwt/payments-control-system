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
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BalanceOverrideDto } from './dto/balance-override.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';
import { BankAccountType } from './bank-account.entity';

@ApiTags('Bank Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Audit('BankAccount')
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly service: BankAccountsService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN)
  create(
    @Body() dto: CreateBankAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query()
    query: PaginationQueryDto & {
      legalEntityId?: string;
      bankId?: string;
      currencyId?: string;
      accountType?: BankAccountType;
      isActive?: 'true' | 'false';
    },
  ) {
    return this.service.findAll(query);
  }

  /**
   * Selectable source accounts for the maker when preparing a TT (§2.5).
   * Filters to CURRENT accounts of the supplied entity, optionally by
   * currency. Chairman-designated accounts are excluded by default.
   */
  @Get('selectable')
  selectableSources(
    @Query('legalEntityId', new ParseUUIDPipe()) legalEntityId: string,
    @Query('currencyId') currencyId?: string,
    @Query('includeChairman') includeChairman?: 'true' | 'false',
  ) {
    return this.service.selectableSources({
      legalEntityId,
      currencyId,
      includeChairman: includeChairman === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  /** Append-only ledger of balance movements (§2.5 audit). */
  @Get(':id/history')
  history(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.history(id);
  }

  @Put(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBankAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.service.remove(id, user.id);
  }

  /**
   * §2.5 — Manual balance override between reconciliations. Logged with
   * user, timestamp, previous value, new value, and reason.
   */
  @Post(':id/balance-override')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD)
  balanceOverride(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: BalanceOverrideDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.manualOverride(id, dto, user.id);
  }
}
