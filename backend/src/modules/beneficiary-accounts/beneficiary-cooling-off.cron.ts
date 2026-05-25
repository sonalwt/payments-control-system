import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BeneficiaryAccountsService } from './beneficiary-accounts.service';

/**
 * §6.3 — Auto-activation cron.
 * Every 5 minutes, activates all PENDING_ACTIVATION beneficiary accounts
 * whose cooling-off window has elapsed.
 */
@Injectable()
export class BeneficiaryCoolingOffCron {
  private readonly logger = new Logger(BeneficiaryCoolingOffCron.name);

  constructor(private readonly service: BeneficiaryAccountsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoActivateCooledOffAccounts(): Promise<void> {
    try {
      const count = await this.service.autoActivateBatch();
      if (count > 0) {
        this.logger.log(`Auto-activated ${count} beneficiary account(s) after cooling-off`);
      }
    } catch (err) {
      this.logger.error('Failed to auto-activate beneficiary accounts', err as Error);
    }
  }
}
