import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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
    @InjectDataSource() private readonly dataSource: DataSource,
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
  async correction(
    @Body() dto: PostExecutionCorrectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // §2.6 — Validate against the live payment request record.
    if (dto.paymentRequestId) {
      const rows: Array<{ proof_of_payment_url: string | null; is_amount_locked: boolean }> =
        await this.dataSource.query(
          `SELECT proof_of_payment_url, is_amount_locked
             FROM payment_requests
            WHERE id = $1
              AND deleted_at IS NULL
            LIMIT 1`,
          [dto.paymentRequestId],
        );

      const pr = rows[0];
      if (!pr) {
        throw new BadRequestException('Payment request not found.');
      }
      if (pr.is_amount_locked) {
        throw new BadRequestException(
          'Amount is locked: the debit has been matched against an uploaded bank statement.',
        );
      }
      if (!pr.proof_of_payment_url) {
        throw new BadRequestException(
          'Proof of payment must be attached to the payment request before a post-execution correction can be made.',
        );
      }
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
