import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChairmanBeneficiariesService } from './chairman-beneficiaries.service';

/**
 * §9 — Auto-activation cron.
 * Every 5 minutes, activates all PENDING_ACTIVATION chairman beneficiaries
 * whose cooling-off window has elapsed.
 */
@Injectable()
export class ChairmanBeneficiaryCoolingOffCron {
  private readonly logger = new Logger(ChairmanBeneficiaryCoolingOffCron.name);

  constructor(private readonly service: ChairmanBeneficiariesService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoActivateCooledOffBeneficiaries(): Promise<void> {
    try {
      const count = await this.service.autoActivateBatch();
      if (count > 0) {
        this.logger.log(`Auto-activated ${count} chairman beneficiar(ies) after cooling-off`);
      }
    } catch (err) {
      this.logger.error('Failed to auto-activate chairman beneficiaries', err as Error);
    }
  }
}
