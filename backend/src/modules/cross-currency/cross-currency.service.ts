import { BadRequestException, Injectable } from '@nestjs/common';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { FxRatesService, ResolvedRate } from '../fx-rates/fx-rates.service';

export interface IndicativeEquivalent {
  isCrossCurrency: boolean;
  sourceAccountId: string;
  sourceCurrencyCode: string;
  paymentCurrencyCode: string;
  paymentAmount: string;
  indicativeSourceAmount: string;
  rateUsed: string;
  rateAsOfDate: string;
  rateIsStale: boolean;
  /** Plain-language note shown to the maker before they confirm. */
  disclosureNote: string;
  /** Minimum-balance evaluation result (always against source currency). */
  minimumBalanceOk: boolean;
  minimumBalanceMessage?: string;
}

/**
 * SOW §2.6 — Cross-Currency Payments.
 *
 * When the entity holds no current account in the payment currency, the
 * maker may select a current account in another currency. This service
 *
 *   1. Computes the indicative source-currency equivalent at the day's
 *      OANDA mid (or override / held-stale rate), with a stale flag
 *      surfaced to the UI.
 *   2. Evaluates the §2.5 minimum-balance check against the indicative
 *      source-currency equivalent, not the payment-currency amount.
 *   3. Emits the disclosure note (final rate is bank-determined).
 *
 * Post-execution correction is delegated to BankAccountsService so the
 * correction goes through the same balance-change ledger as ordinary
 * movements.
 */
@Injectable()
export class CrossCurrencyService {
  constructor(
    private readonly bankAccounts: BankAccountsService,
    private readonly fxRates: FxRatesService,
  ) {}

  async indicativeEquivalent(args: {
    sourceAccountId: string;
    paymentCurrencyCode: string;
    paymentAmount: string;
    asOfDate?: string;
  }): Promise<IndicativeEquivalent> {
    const acct = await this.bankAccounts.findOne(args.sourceAccountId);
    const sourceCurrency = acct.currency?.code;
    if (!sourceCurrency) {
      throw new BadRequestException(
        `Source account ${acct.id} has no currency loaded.`,
      );
    }
    if (acct.accountType !== 'CURRENT') {
      throw new BadRequestException(
        'Cross-currency payments must be funded from a CURRENT account.',
      );
    }

    const paymentAmount = this.toNumber(args.paymentAmount);
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const isCrossCurrency = sourceCurrency !== args.paymentCurrencyCode;

    let indicativeSourceAmount = paymentAmount;
    let rate: ResolvedRate;

    if (!isCrossCurrency) {
      // Same currency — rate is 1.0, no FX disclosure needed.
      rate = await this.fxRates.getRate(
        args.paymentCurrencyCode,
        args.asOfDate,
        sourceCurrency,
      );
      indicativeSourceAmount = paymentAmount;
    } else {
      // Resolve sourceCurrency-per-paymentCurrency:
      //   1 paymentCcy = R sourceCcy  =>  sourceAmount = paymentAmount * R
      rate = await this.fxRates.getRate(
        sourceCurrency,
        args.asOfDate,
        args.paymentCurrencyCode,
      );
      indicativeSourceAmount = paymentAmount * this.toNumber(rate.rate);
    }

    // §2.5 — min-balance check against the indicative source amount.
    let minimumBalanceOk = true;
    let minimumBalanceMessage: string | undefined;
    try {
      await this.bankAccounts.assertMinimumBalance(
        acct.id,
        indicativeSourceAmount.toFixed(4),
      );
    } catch (e) {
      minimumBalanceOk = false;
      minimumBalanceMessage = (e as Error).message;
    }

    const disclosureNote = isCrossCurrency
      ? `Indicative source-currency amount at ${rate.providerName ?? 'recorded'} mid ` +
        `${rate.rate} as of ${rate.asOfDate}. ` +
        (rate.isStale
          ? `Stale rate (held from ${rate.asOfDate}). `
          : '') +
        `Final amount debited will be bank-determined.`
      : 'Same-currency payment; no FX conversion applies.';

    return {
      isCrossCurrency,
      sourceAccountId: acct.id,
      sourceCurrencyCode: sourceCurrency,
      paymentCurrencyCode: args.paymentCurrencyCode,
      paymentAmount: paymentAmount.toFixed(4),
      indicativeSourceAmount: indicativeSourceAmount.toFixed(4),
      rateUsed: rate.rate,
      rateAsOfDate: rate.asOfDate,
      rateIsStale: rate.isStale,
      disclosureNote,
      minimumBalanceOk,
      minimumBalanceMessage,
    };
  }

  private toNumber(v: string): number {
    const n = Number(v);
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`Invalid numeric value: ${v}`);
    }
    return n;
  }
}
