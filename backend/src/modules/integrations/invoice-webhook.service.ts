import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Notification } from '../notifications/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentRequest } from '../payment-requests/payment-request.entity';
import { PaymentRequestsService } from '../payment-requests/payment-requests.service';
import { User } from '../users/user.entity';
import { Currency } from '../currencies/currency.entity';
import { InvoiceWebhookDto } from './dto/invoice-webhook.dto';
import { InvoiceNameResolver, ResolutionIssue } from './invoice-name-resolver.service';
import { CounterpartyProvisioner, ProvisionResult } from './counterparty-provisioner.service';

/** Notification type raised when an inbound invoice cannot be mapped. */
const UNRESOLVED_NOTIFICATION = 'INTEGRATION_INVOICE_UNRESOLVED';

/** Notification type raised when a draft is waiting for a maker to classify it. */
const DRAFT_NOTIFICATION = 'PAYMENT_REQUEST_DRAFT_PENDING';

/** Raised to admins when no initiator exists for the invoice's legal entity. */
const NO_INITIATOR_NOTIFICATION = 'INTEGRATION_NO_INITIATOR';

/** Raised to the KYC team when a supplier was created from an invoice. */
const PROVISIONED_NOTIFICATION = 'INTEGRATION_SUPPLIER_PROVISIONED';

export interface InvoiceWebhookResult {
  /** CREATED — raised now. DUPLICATE — this invoice was already delivered. */
  outcome: 'CREATED' | 'DUPLICATE';
  paymentRequestId: string;
  requestNumber: string;
  status: string;
  externalInvoiceId: string;
  /** True while the draft still needs a PCS maker to choose a payment type. */
  awaitingPaymentType: boolean;
  matched?: Record<string, string | null>;
  warnings?: string[];
}

/**
 * Inbound integration: turns an invoice raised in the upstream invoicing
 * application into a PCS payment request.
 *
 * Design notes
 *  - The upstream system knows names, not PCS ids. InvoiceNameResolver maps
 *    them; unresolvable names come back as a 422 listing every bad field at
 *    once rather than one per round-trip.
 *  - The webhook does NOT choose a payment type. A payment type selects the
 *    approval matrix — who authorises the money — so the request is saved as a
 *    DRAFT without one, every eligible maker is notified, and a human picks it,
 *    reviews the request and submits. From there the normal workflow applies.
 *  - Delivery is idempotent on (externalSystem, externalInvoiceId): a retry
 *    returns the request already created instead of paying the invoice twice.
 */
@Injectable()
export class InvoiceWebhookService {
  private readonly logger = new Logger(InvoiceWebhookService.name);

  constructor(
    private readonly resolver: InvoiceNameResolver,
    private readonly provisioner: CounterpartyProvisioner,
    @InjectRepository(Currency)
    private readonly currencies: Repository<Currency>,
    private readonly paymentRequests: PaymentRequestsService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    @InjectRepository(PaymentRequest)
    private readonly prRepo: Repository<PaymentRequest>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async handleInvoice(dto: InvoiceWebhookDto): Promise<InvoiceWebhookResult> {
    const source = dto.externalSystem.toUpperCase();

    // 1. Idempotency — a redelivered invoice must not raise a second payment.
    const existing = await this.findByExternalRef(source, dto.externalInvoiceId);
    if (existing) {
      this.logger.log(
        `Invoice ${source}:${dto.externalInvoiceId} already mapped to ${existing.requestNumber}; returning existing request.`,
      );
      return this.existingResult(existing, dto.externalInvoiceId);
    }

    // 2. Resolve every name against the PCS masters.
    let { resolved, issues } = await this.resolver.resolve(dto);

    // 2a. A supplier PCS has never seen is provisioned rather than refused, so
    //     a genuine new vendor does not bounce back to the sender. Only when
    //     the counterparty is the SOLE unresolved name and nothing in the
    //     master resembles it — a near miss is a human's call, since a
    //     lookalike of an approved vendor with different bank details is how
    //     invoice fraud works. Everything created is PENDING and unpayable.
    if (!resolved && this.isNewSupplierOnly(issues)) {
      const provisioned = await this.provisionSupplier(dto);
      if (provisioned) {
        ({ resolved, issues } = await this.resolver.resolve(dto));
        // Why no account was created (unknown bank, or one already on file for
        // another supplier) belongs in the response too, not only in the alert.
        if (resolved && provisioned.accountSkippedReason) {
          resolved.warnings.push(provisioned.accountSkippedReason);
        }
      }
    }

    if (!resolved) {
      // The invoice is rejected, so nothing lands in the payment tables — but
      // an admin has to know a supplier's invoice is stuck on missing master
      // data, otherwise the failure is only visible to the sending system.
      await this.notifyAdminsOfUnresolved(dto, source, issues);
      throw new UnprocessableEntityException({
        message: 'One or more names on the invoice could not be resolved in PCS.',
        error: 'UnresolvedReferences',
        issues,
      });
    }

    // 3. Create the DRAFT as the integration service account, with no payment
    //    type — a maker chooses one, because it selects the approval chain.
    const makerId = await this.integrationMakerId();
    let created: PaymentRequest;
    try {
      created = await this.paymentRequests.createFromIntegration(
        {
          currencyId: resolved.currencyId,
          counterpartyId: resolved.counterpartyId ?? undefined,
          legalEntityId: resolved.legalEntityId ?? undefined,
          beneficiaryAccountId: resolved.beneficiaryAccountId ?? undefined,
          amount: dto.amount,
          invoiceNumber: this.sanitiseInvoiceNumber(dto.invoiceNumber),
          dueDate: dto.dueDate,
          dealId: dto.dealId,
          purposeDescription: this.buildPurpose(dto, !!resolved.beneficiaryAccountId),
          documents: dto.documents?.map((d) => ({
            documentCode: d.documentCode ?? 'INVOICE',
            documentLabel: d.documentLabel,
            fileName: d.fileName,
            fileUrl: d.fileUrl,
            fileSizeBytes: d.fileSizeBytes,
            mimeType: d.mimeType,
          })),
          externalSource: source,
          externalReference: dto.externalInvoiceId,
        },
        makerId,
      );
    } catch (err) {
      // Two deliveries raced past the check above; the unique index caught the
      // second. Return the winner rather than a 409 the sender cannot act on.
      if (this.isUniqueViolation(err)) {
        const winner = await this.findByExternalRef(source, dto.externalInvoiceId);
        if (winner) return this.existingResult(winner, dto.externalInvoiceId);
      }
      throw err;
    }

    // 4. Tell the people who can classify it that there is work waiting.
    await this.notifyMakersOfDraft(created, dto, resolved.warnings);

    return {
      outcome: 'CREATED',
      paymentRequestId: created.id,
      requestNumber: created.requestNumber,
      status: created.status,
      externalInvoiceId: dto.externalInvoiceId,
      awaitingPaymentType: true,
      matched: resolved.matched,
      warnings: resolved.warnings.length > 0 ? resolved.warnings : undefined,
    };
  }

  /**
   * True when the only thing PCS could not resolve is the supplier, and nothing
   * in the counterparty master resembles the name. Any other unresolved field —
   * or a near miss on the supplier — must still be refused.
   */
  private isNewSupplierOnly(issues: ResolutionIssue[]): boolean {
    return (
      issues.length === 1 &&
      issues[0].field === 'counterpartyName' &&
      issues[0].autoCreatable === true
    );
  }

  /**
   * Create the supplier (and its account, where the bank is known) so the
   * invoice can be captured. Returns false if provisioning itself fails, in
   * which case the caller falls through to the normal 422.
   */
  private async provisionSupplier(dto: InvoiceWebhookDto): Promise<ProvisionResult | null> {
    // The account needs the request currency; if that did not resolve we would
    // not be here, since it would have been a second issue.
    const currency = await this.currencies.findOne({
      where: [{ code: dto.currency.trim().toUpperCase() }, { name: dto.currency.trim() }],
      select: ['id'],
    });
    if (!currency) return null;

    try {
      const result = await this.provisioner.provision(dto, currency.id);
      await this.notifyOfProvisionedSupplier(dto, result);
      return result;
    } catch (err) {
      this.logger.error(
        `Could not provision supplier "${dto.counterpartyName}" from ${dto.externalSystem} invoice ${dto.externalInvoiceId}`,
        err instanceof Error ? err.stack : String(err),
      );
      return null;
    }
  }

  /**
   * A supplier and bank details entered PCS without a person typing them, so
   * say so loudly: to the KYC team who must verify them, and to admins.
   * Never throws — alerting must not fail an accepted invoice.
   */
  private async notifyOfProvisionedSupplier(
    dto: InvoiceWebhookDto,
    result: ProvisionResult,
  ): Promise<void> {
    try {
      const recipients: Array<{ id: string }> = await this.prRepo.manager.query(
        `SELECT DISTINCT u.id FROM users u
          WHERE u.is_active AND u.deleted_at IS NULL
            AND (u.is_platform_admin
                 OR EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                             WHERE ur.user_id = u.id AND r.code = 'KYC_TEAM'))`,
      );
      const account = result.beneficiaryAccountId
        ? 'Its bank account was created as PENDING ACTIVATION with a cooling-off window.'
        : (result.accountSkippedReason ?? 'No bank account was created.');
      const message =
        `${dto.externalSystem} invoice ${dto.externalInvoiceId} named a supplier PCS did not hold, ` +
        `so "${result.counterpartyName}" (${result.counterpartyCode}) was created with KYC PENDING.\n\n` +
        `${account}\n\n` +
        'Nothing can be paid to it until KYC is approved and the account activated. ' +
        'Verify the supplier and its bank details from a source other than the invoice before approving.';
      for (const r of recipients) {
        await this.notifications.create(
          r.id,
          PROVISIONED_NOTIFICATION,
          `New supplier "${result.counterpartyName}" awaiting KYC`.slice(0, 200),
          message,
          {
            externalSystem: dto.externalSystem.toUpperCase(),
            externalInvoiceId: dto.externalInvoiceId,
            counterpartyCode: result.counterpartyCode,
            counterpartyName: result.counterpartyName,
            beneficiaryAccountId: result.beneficiaryAccountId,
          },
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to announce provisioned supplier for ${dto.externalInvoiceId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /**
   * The purpose shown to the maker and every approver.
   *
   * When the invoice's bank account matched the beneficiary master the linked
   * account is authoritative and repeating it would be noise. When it did not
   * match, the supplied details are appended here — the one field that travels
   * with the request and is read by everyone who reviews it — so the maker can
   * check them against the master and raise the account properly if needed.
   */
  private buildPurpose(
    dto: InvoiceWebhookDto,
    beneficiaryMatched: boolean,
  ): string | undefined {
    // The deal reference has its own column, so the purpose stays free text.
    if (beneficiaryMatched) return dto.purposeDescription;
    // purposeDescription is optional; without one the bank block stands alone.
    const head = dto.purposeDescription ? `${dto.purposeDescription}\n\n` : '';

    const b = dto.supplierBankAccount;
    const lines = [
      `Account name: ${b.accountName}`,
      b.accountNumber ? `Account number: ${b.accountNumber}` : null,
      b.iban ? `IBAN: ${b.iban}` : null,
      b.swiftBic ? `SWIFT/BIC: ${b.swiftBic}` : null,
      b.bankName ? `Bank: ${b.bankName}` : null,
      b.branchName ? `Branch: ${b.branchName}` : null,
      b.countryCode ? `Country: ${b.countryCode}` : null,
    ].filter((l): l is string => l !== null);

    return (
      `${head}` +
      `--- Supplier bank account as printed on the invoice ---\n` +
      `${lines.join('\n')}\n` +
      `(Not found on the beneficiary master. Verify before selecting a beneficiary.)`
    );
  }

  /**
   * Tell the people who can actually classify this draft that one is waiting.
   *
   * That is the initiators for the invoice's own legal entity: users configured
   * as Maker on a live payment type in the integration's category that belongs
   * to that entity. Notifying every maker in the company instead would reach
   * people who cannot act on it — a payment type is bound to a single legal
   * entity, so someone who makes only for another entity has nothing to pick.
   *
   * The audience deliberately mirrors both the visibility clause in
   * PaymentRequestsService.findAll() and the payment type dropdown, so the set
   * of people told, the set who can see it, and the set who can act are one and
   * the same. Change one, change the others.
   *
   * In-app only: an email per invoice to a standing group trains people to
   * ignore it.
   *
   * Never throws — a failed notification must not fail an accepted invoice.
   */
  private async notifyMakersOfDraft(
    pr: PaymentRequest,
    dto: InvoiceWebhookDto,
    warnings: string[],
  ): Promise<void> {
    try {
      const category = this.config.get<string>('app.integrationPaymentCategory') ?? '';
      const makers: Array<{ id: string }> = await this.prRepo.manager.query(
        `SELECT u.id FROM users u
          WHERE u.is_active AND u.deleted_at IS NULL
            AND EXISTS (
              SELECT 1 FROM payment_types pt
              LEFT JOIN payment_categories pc ON pc.id = pt.payment_category_id
              WHERE pt.is_active AND pt.deleted_at IS NULL
                AND ($1::text = '' OR pc.name = $1)
                AND ($2::uuid IS NULL
                     OR pt.legal_entity_id = $2::uuid
                     OR $2::uuid = ANY(pt.legal_entity_ids))
                AND (pt.maker_user_id = u.id
                     OR EXISTS (SELECT 1 FROM user_roles ur
                                 WHERE ur.user_id = u.id
                                   AND (ur.role_id = ANY(pt.maker_role_ids)
                                        OR ur.role_id = pt.maker_role_id)))
            )`,
        [category, pr.legalEntityId ?? null],
      );
      if (makers.length === 0) {
        // Nobody can classify this. Silence would strand the invoice, so escalate.
        this.logger.warn(
          `${pr.requestNumber} awaits classification but no initiator is configured for its legal entity.`,
        );
        await this.notifyAdminsOfNoInitiator(pr, dto);
        return;
      }

      const title = `${pr.requestNumber} needs a payment type`;
      const message =
        `Invoice ${dto.invoiceNumber} for deal ${dto.dealId}, from ${dto.counterpartyName} ` +
        `(${dto.currency} ${dto.amount}), arrived from ${dto.externalSystem} and is saved as a draft.\n\n` +
        'Open it, select the payment type, check the details and submit it for approval.' +
        (warnings.length > 0 ? `\n\nNeeds attention:\n${warnings.map((w) => `• ${w}`).join('\n')}` : '');

      const metadata = {
        paymentRequestId: pr.id,
        requestNumber: pr.requestNumber,
        externalSystem: dto.externalSystem.toUpperCase(),
        externalInvoiceId: dto.externalInvoiceId,
        counterparty: dto.counterpartyName,
        amount: dto.amount,
        currency: dto.currency,
        invoiceNumber: dto.invoiceNumber,
        dealId: dto.dealId,
      };

      for (const maker of makers) {
        await this.notifications.create(maker.id, DRAFT_NOTIFICATION, title, message, metadata);
      }
      this.logger.log(
        `${pr.requestNumber} created awaiting classification; notified ${makers.length} maker(s).`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to notify makers about ${pr.requestNumber}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /**
   * The invoice resolved, but no user is an initiator for its legal entity, so
   * nobody can classify the draft. Tell the admins rather than let it sit in a
   * queue no one is watching — the fix is master data (a payment type for that
   * entity, or a maker role on one), not a redelivery.
   */
  private async notifyAdminsOfNoInitiator(
    pr: PaymentRequest,
    dto: InvoiceWebhookDto,
  ): Promise<void> {
    const admins = await this.users.find({
      where: { isPlatformAdmin: true, isActive: true },
      select: ['id'],
    });
    const message =
      `${pr.requestNumber} (invoice ${dto.invoiceNumber} from ${dto.counterpartyName}, ` +
      `${dto.currency} ${dto.amount}) was received for ${dto.legalEntityName}, but no user is ` +
      'configured as an initiator for that legal entity, so nobody can select a payment type.\n\n' +
      'Configure a payment type for the entity, or assign the maker role to someone, then the ' +
      'draft can be picked up.';
    for (const admin of admins) {
      await this.notifications.create(
        admin.id,
        NO_INITIATOR_NOTIFICATION,
        `${pr.requestNumber} has no initiator for ${dto.legalEntityName}`.slice(0, 200),
        message,
        {
          paymentRequestId: pr.id,
          requestNumber: pr.requestNumber,
          externalSystem: dto.externalSystem.toUpperCase(),
          externalInvoiceId: dto.externalInvoiceId,
          legalEntityName: dto.legalEntityName,
        },
      );
    }
  }

  /**
   * Raise a dashboard notification for every platform admin when an inbound
   * invoice cannot be mapped to the PCS masters.
   *
   * Deduplicated on the invoice: senders retry, and one stuck invoice must not
   * bury the notification bell. While an unread alert for the same invoice is
   * outstanding, repeat deliveries are silent. Marking it read after fixing the
   * master data re-arms the alert, so a still-broken retry speaks up again.
   *
   * Never throws — an alerting failure must not turn a clean 422 into a 500.
   */
  private async notifyAdminsOfUnresolved(
    dto: InvoiceWebhookDto,
    source: string,
    issues: ResolutionIssue[],
  ): Promise<void> {
    try {
      const alreadyRaised = await this.notificationRepo
        .createQueryBuilder('n')
        .where('n.type = :type', { type: UNRESOLVED_NOTIFICATION })
        .andWhere('n.is_read = false')
        .andWhere("n.metadata ->> 'externalInvoiceId' = :ref", { ref: dto.externalInvoiceId })
        .andWhere("n.metadata ->> 'externalSystem' = :src", { src: source })
        .getCount();
      if (alreadyRaised > 0) return;

      const admins = await this.users.find({
        where: { isPlatformAdmin: true, isActive: true },
        select: ['id'],
      });
      if (admins.length === 0) {
        this.logger.warn(
          `Invoice ${source}:${dto.externalInvoiceId} could not be mapped and there is no active platform admin to notify.`,
        );
        return;
      }

      const fields = issues.map((i) => i.field).join(', ');
      const detail = issues.map((i) => `• ${i.field}: ${i.message}`).join('\n');
      const payee = dto.counterpartyName;
      const message =
        `Invoice ${dto.externalInvoiceId} from ${source} (${payee}, ${dto.currency} ${dto.amount}) ` +
        `could not be turned into a payment request because ${issues.length === 1 ? 'a name does' : 'some names do'} ` +
        `not match the PCS masters:\n${detail}\n\n` +
        'Add or correct the master record, then ask the sending system to resend.';

      const metadata: Record<string, unknown> = {
        externalSystem: source,
        externalInvoiceId: dto.externalInvoiceId,
        issues,
        payload: dto,
      };

      for (const admin of admins) {
        await this.notifications.create(
          admin.id,
          UNRESOLVED_NOTIFICATION,
          `Invoice ${dto.externalInvoiceId} could not be mapped (${fields})`.slice(0, 200),
          message,
          metadata,
        );
      }
      this.logger.warn(
        `Invoice ${source}:${dto.externalInvoiceId} unresolved (${fields}); notified ${admins.length} admin(s).`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to raise the admin notification for unresolved invoice ${source}:${dto.externalInvoiceId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private findByExternalRef(
    source: string,
    externalInvoiceId: string,
  ): Promise<PaymentRequest | null> {
    return this.prRepo.findOne({
      where: { externalSource: source, externalReference: externalInvoiceId },
    });
  }

  private existingResult(pr: PaymentRequest, externalInvoiceId: string): InvoiceWebhookResult {
    return {
      outcome: 'DUPLICATE',
      paymentRequestId: pr.id,
      requestNumber: pr.requestNumber,
      status: pr.status,
      externalInvoiceId,
      awaitingPaymentType: !pr.paymentTypeId,
    };
  }

  /**
   * Optional service account that integration-created requests are attributed
   * to until a maker claims one. Returns null when unset, and that is a
   * supported state rather than a failure:
   *
   *   - created_by is nullable, and the employee portal already leaves it null
   *     for the same reason — the row was not created by a PCS user;
   *   - external_source / external_reference already record the true origin,
   *     which is better audit evidence than a human's name on a request they
   *     did not raise;
   *   - claiming the draft sets created_by to the maker who classifies it, so
   *     the gap only spans the period when no person is responsible for it.
   *
   * A value that is set but does not resolve is an operator mistake, so it is
   * logged loudly — but it still does not reject the invoice. Capturing the
   * invoice matters more than attributing it.
   */
  private async integrationMakerId(): Promise<string | null> {
    const email = this.config.get<string>('app.integrationMakerEmail') ?? '';
    if (!email) return null;

    const user = await this.users.findOne({
      where: { email },
      select: ['id', 'isActive'],
    });
    if (!user || !user.isActive) {
      this.logger.error(
        `INTEGRATION_MAKER_EMAIL is set to "${email}", which is not an active PCS user. ` +
          'Integration requests will be recorded with no creator until this is corrected.',
      );
      return null;
    }
    return user.id;
  }

  /**
   * PCS invoice numbers allow A-Z 0-9 - _ / only (§4.1), while invoicing
   * systems routinely emit spaces and #. Normalise rather than reject: the
   * invoice number is a reference, not a key.
   */
  private sanitiseInvoiceNumber(value?: string): string | undefined {
    if (!value) return undefined;
    const cleaned = value
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9\-_/]/g, '')
      .slice(0, 60);
    return cleaned.length > 0 ? cleaned : undefined;
  }

  private isUniqueViolation(err: unknown): boolean {
    return err instanceof QueryFailedError && (err as { code?: string }).code === '23505';
  }
}
