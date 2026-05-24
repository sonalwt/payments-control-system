import {
  Body,
  Controller,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CrossCurrencyService } from './cross-currency.service';
import { IndicativeEquivalentQueryDto } from './dto/indicative-equivalent.dto';
import { PostExecutionCorrectionDto } from './dto/post-execution-correction.dto';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Cross-Currency Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Audit('CrossCurrencyPayment')
@Controller('cross-currency')
export class CrossCurrencyController {
  constructor(
    private readonly service: CrossCurrencyService,
    private readonly bankAccounts: BankAccountsService,
  ) {}

  /**
   * §2.6 — Indicative source-currency equivalent for a payment-currency
   * release. Returns the rate used, stale-flag, and the §2.5 min-balance
   * evaluation against the indicative amount.
   */
  @Post('indicative-equivalent')
  indicative(@Body() dto: IndicativeEquivalentQueryDto) {
    return this.service.indicativeEquivalent(dto);
  }

  /**
   * §2.6 — Post-execution amount correction.
   *
   * Permitted while the request is in Paid status; once the debit has
   * been matched against an uploaded bank statement the amount is locked
   * and this call is rejected upstream by the payments-lifecycle module.
   * The correction requires the proof of payment to be attached; this
   * controller assumes the attachment was already persisted against the
   * payment request by the caller.
   */
  @Post('post-execution-correction')
  @Roles(RoleCode.PAYMENTS_MAKER, RoleCode.PAYMENTS_CHECKER, RoleCode.FINANCE_HEAD)
  correction(
    @Body() dto: PostExecutionCorrectionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('locked') locked?: 'true' | 'false',
  ) {
    if (locked === 'true') {
      // Hard guard for callers that have already matched the request
      // against a statement; the lifecycle module is the source of truth
      // for status, but this is a useful belt-and-braces check.
      throw new Error(
        'Amount is locked: the debit has been matched against a bank statement.',
      );
    }
    return this.bankAccounts.correctCrossCurrencyDebit({
      accountId: dto.sourceAccountId,
      previouslyDebited: dto.previouslyDebited,
      correctedAmount: dto.correctedAmount,
      reason: dto.reason,
      userId: user.id,
      paymentRequestId: dto.paymentRequestId ?? null,
    });
  }
}
