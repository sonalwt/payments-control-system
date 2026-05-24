import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from './payment-request.entity';
import { PaymentRequestApproval } from './payment-request-approval.entity';
import { PaymentRequestDocument } from './payment-request-document.entity';

@Injectable()
export class PaymentRequestsRepository {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly prRepo: Repository<PaymentRequest>,
    @InjectRepository(PaymentRequestApproval)
    private readonly approvalRepo: Repository<PaymentRequestApproval>,
    @InjectRepository(PaymentRequestDocument)
    private readonly docRepo: Repository<PaymentRequestDocument>,
  ) {}

  get raw(): Repository<PaymentRequest> {
    return this.prRepo;
  }

  create(data: Partial<PaymentRequest>): PaymentRequest {
    return this.prRepo.create(data);
  }

  save(entity: PaymentRequest): Promise<PaymentRequest> {
    return this.prRepo.save(entity);
  }

  findOneById(id: string, withRelations = false): Promise<PaymentRequest | null> {
    return this.prRepo.findOne({
      where: { id },
      relations: withRelations
        ? {
            legalEntity: true,
            counterparty: true,
            employee: true,
            sourceAccount: { bank: true, currency: true },
            beneficiaryAccount: { bank: true, currency: true, counterparty: true, employee: true },
            approvals: true,
            documents: true,
          }
        : {},
    });
  }

  async softRemove(entity: PaymentRequest): Promise<PaymentRequest> {
    return this.prRepo.softRemove(entity);
  }

  // -----------------------------------------------------------------------
  // Request-number sequence
  // -----------------------------------------------------------------------

  async nextSequenceValue(): Promise<number> {
    const result = await this.prRepo.query(
      `SELECT nextval('payment_request_seq') AS val`,
    );
    return Number((result as Array<{ val: string }>)[0].val);
  }

  // -----------------------------------------------------------------------
  // Approvals
  // -----------------------------------------------------------------------

  saveApproval(entity: PaymentRequestApproval): Promise<PaymentRequestApproval> {
    return this.approvalRepo.save(entity);
  }

  saveApprovals(entities: PaymentRequestApproval[]): Promise<PaymentRequestApproval[]> {
    return this.approvalRepo.save(entities);
  }

  async findApprovals(paymentRequestId: string): Promise<PaymentRequestApproval[]> {
    // Fetch the base records first, then enrich with role/user display names.
    const approvals = await this.approvalRepo.find({
      where: { paymentRequestId },
      order: { stepOrder: 'ASC' },
    });
    if (approvals.length === 0) return approvals;

    const rows = await this.approvalRepo.query(
      `SELECT
         pra.id,
         r.name  AS approver_role_name,
         u.email AS approver_user_email,
         u.full_name AS approver_user_name
       FROM payment_request_approvals pra
       LEFT JOIN roles r ON r.id = pra.approver_role_id
       LEFT JOIN users u ON u.id = pra.approver_user_id
       WHERE pra.payment_request_id = $1`,
      [paymentRequestId],
    ) as Array<{
      id: string;
      approver_role_name: string | null;
      approver_user_email: string | null;
      approver_user_name: string | null;
    }>;

    const map = new Map(rows.map((r) => [r.id, r]));
    for (const a of approvals) {
      const extra = map.get(a.id);
      if (extra) {
        (a as any).approverRoleName = extra.approver_role_name ?? null;
        (a as any).approverUserEmail = extra.approver_user_email ?? null;
        (a as any).approverUserName = extra.approver_user_name ?? null;
      }
    }
    return approvals;
  }

  // -----------------------------------------------------------------------
  // Documents
  // -----------------------------------------------------------------------

  saveDocuments(entities: PaymentRequestDocument[]): Promise<PaymentRequestDocument[]> {
    return this.docRepo.save(entities);
  }

  findDocuments(paymentRequestId: string): Promise<PaymentRequestDocument[]> {
    return this.docRepo.find({
      where: { paymentRequestId },
      order: { createdAt: 'ASC' },
    });
  }

  // -----------------------------------------------------------------------
  // Role-based approval check (§3): user holds the approver role in the entity
  // -----------------------------------------------------------------------

  async userHasRoleInEntity(
    userId: string,
    roleId: string,
    legalEntityId: string,
  ): Promise<boolean> {
    const count = await this.prRepo.query(
      `SELECT COUNT(*) AS cnt
         FROM user_entity_roles
        WHERE user_id        = $1
          AND role_id        = $2
          AND legal_entity_id = $3
          AND is_active      = TRUE`,
      [userId, roleId, legalEntityId],
    );
    return Number((count as Array<{ cnt: string }>)[0].cnt) > 0;
  }

  /** Returns whether the payment type requires an approval chain. */
  async paymentTypeRequiresApprovalChain(code: string): Promise<boolean> {
    const rows = await this.prRepo.query(
      `SELECT requires_approval_chain FROM payment_types WHERE code = $1 AND is_active = TRUE LIMIT 1`,
      [code],
    );
    if (!rows || (rows as unknown[]).length === 0) return true; // default: require chain
    return Boolean((rows as Array<{ requires_approval_chain: boolean }>)[0].requires_approval_chain);
  }

  /**
   * §6.5 — Returns true when the given country code appears in the active
   * sanctioned-country master.
   */
  async isSanctionedCountry(countryCode: string): Promise<boolean> {
    const rows = await this.prRepo.query(
      `SELECT 1 FROM sanctioned_countries
        WHERE country_code = $1
          AND is_active = TRUE
          AND deleted_at IS NULL
        LIMIT 1`,
      [countryCode.toUpperCase()],
    );
    return (rows as unknown[]).length > 0;
  }

  /** Returns the document policy array for the given payment type code (§4.1). */
  async findDocumentPolicyByPaymentType(code: string): Promise<Array<{
    code: string;
    label: string;
    required: boolean;
    amountThresholdMinor: number | null;
    currencyCode: string | null;
  }>> {
    const rows = await this.prRepo.query(
      `SELECT document_policy FROM payment_types WHERE code = $1 AND is_active = TRUE LIMIT 1`,
      [code],
    );
    if (!rows || (rows as unknown[]).length === 0) return [];
    return (rows as Array<{ document_policy: unknown }>)[0].document_policy as Array<{
      code: string;
      label: string;
      required: boolean;
      amountThresholdMinor: number | null;
      currencyCode: string | null;
    }> ?? [];
  }
}
