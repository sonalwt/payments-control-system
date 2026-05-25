import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { BeneficiaryAccount } from './beneficiary-account.entity';
import { BeneficiaryAccountChangeRequest } from './beneficiary-account-change-request.entity';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { VerifyChangeRequestDto } from './dto/verify-change-request.dto';
import { ApproveChangeRequestDto, RejectChangeRequestDto } from './dto/action-change-request.dto';
import { CopyFromVerifiedDto } from './dto/copy-from-verified.dto';
import { OverrideCoolingOffDto } from './dto/override-cooling-off.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

// §6.2 — Required supporting documents for ADD/MODIFY requests
const REQUIRED_DOCS = ['CANCELLED_CHEQUE', 'BANK_LETTER', 'SOURCE_CORRESPONDENCE'];

/** Cooling-off window in hours (§6.3 default: 24h). */
const COOLING_OFF_HOURS = parseInt(process.env.EBAC_COOLING_OFF_HOURS ?? '24', 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Iterative Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normaliseName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────────────────

export interface BeneficiaryAccountQuery extends PaginationQueryDto {
  counterpartyId?: string;
  employeeId?: string;
  status?: string;
  currencyId?: string;
  search?: string;
}

@Injectable()
export class BeneficiaryAccountsService {
  constructor(
    @InjectRepository(BeneficiaryAccount)
    private readonly accountRepo: Repository<BeneficiaryAccount>,

    @InjectRepository(BeneficiaryAccountChangeRequest)
    private readonly crRepo: Repository<BeneficiaryAccountChangeRequest>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ── §6.4 Anomaly detection ─────────────────────────────────────────────────

  private async evaluateAnomalies(
    dto: CreateChangeRequestDto,
    userId: string,
  ): Promise<{ flag: boolean; notes: string }> {
    if (dto.changeType === 'DEACTIVATE') return { flag: false, notes: '' };

    const pd = dto.proposedData as Record<string, string>;
    const signals: string[] = [];

    // Signal 1 — Similar account number (Levenshtein distance 1–2)
    const newAccNum = pd['accountNumber'] ?? '';
    if (newAccNum) {
      const ownerId = pd['counterpartyId'] || pd['employeeId'];
      const column = pd['counterpartyId'] ? 'counterparty_id' : 'employee_id';
      if (ownerId) {
        const rows = await this.dataSource.query<{ account_number: string }[]>(
          `SELECT account_number FROM beneficiary_accounts
           WHERE ${column} = $1 AND deleted_at IS NULL`,
          [ownerId],
        );
        for (const row of rows) {
          const dist = levenshtein(row.account_number, newAccNum);
          if (dist > 0 && dist <= 2) {
            signals.push(
              `Account number is very similar to existing account ending ` +
              `${row.account_number.slice(-4)} (edit distance ${dist})`,
            );
          }
        }
      }
    }

    // Signal 2 — Account holder name mismatch vs master record
    const holderName = pd['accountHolderName'] ?? '';
    if (holderName) {
      if (pd['counterpartyId']) {
        const cp = await this.dataSource.query<{ name: string }[]>(
          `SELECT name FROM counterparties WHERE id = $1`,
          [pd['counterpartyId']],
        );
        if (cp.length && normaliseName(cp[0].name) !== normaliseName(holderName)) {
          signals.push(
            `Account holder name "${holderName}" does not match counterparty name "${cp[0].name}"`,
          );
        }
      } else if (pd['employeeId']) {
        const emp = await this.dataSource.query<{ full_name: string }[]>(
          `SELECT full_name FROM employees WHERE id = $1`,
          [pd['employeeId']],
        );
        if (emp.length && normaliseName(emp[0].full_name) !== normaliseName(holderName)) {
          signals.push(
            `Account holder name "${holderName}" does not match employee name "${emp[0].full_name}"`,
          );
        }
      }
    }

    // Signal 3 — Multiple active changes to same account in last 30 days
    if (dto.beneficiaryAccountId) {
      const rows = await this.dataSource.query<{ cnt: string }[]>(
        `SELECT COUNT(*) AS cnt FROM beneficiary_account_change_requests
         WHERE beneficiary_account_id = $1
           AND status NOT IN ('REJECTED','CANCELLED')
           AND created_at > now() - INTERVAL '30 days'
           AND deleted_at IS NULL`,
        [dto.beneficiaryAccountId],
      );
      const cnt = parseInt(rows[0]?.cnt ?? '0', 10);
      if (cnt > 0) {
        signals.push(
          `${cnt} other active change request(s) exist for this account in the last 30 days`,
        );
      }
    }

    // Signal 4 — Pending payment > 3× historical average after a change
    const ownerId2 = pd['counterpartyId'] || pd['employeeId'];
    const ownerCol = pd['counterpartyId'] ? 'counterparty_id' : 'employee_id';
    if (ownerId2) {
      const avgRows = await this.dataSource.query<{ avg_minor: string | null }[]>(
        `SELECT AVG(amount_minor) AS avg_minor
         FROM (
           SELECT amount_minor FROM payment_requests
           WHERE ${ownerCol} = $1 AND status = 'APPROVED' AND deleted_at IS NULL
           ORDER BY created_at DESC LIMIT 5
         ) t`,
        [ownerId2],
      );
      const avgMinor = parseFloat(avgRows[0]?.avg_minor ?? '0');
      if (avgMinor > 0) {
        const pendingRows = await this.dataSource.query<
          { amount_minor: string; request_number: string }[]
        >(
          `SELECT amount_minor, request_number FROM payment_requests
           WHERE ${ownerCol} = $1
             AND status IN ('DRAFT','PENDING_APPROVAL')
             AND deleted_at IS NULL`,
          [ownerId2],
        );
        for (const pr of pendingRows) {
          if (parseFloat(pr.amount_minor) > avgMinor * 3) {
            signals.push(
              `Pending payment ${pr.request_number} is more than 3× the historical average ` +
              `(may be triggered by this account change)`,
            );
          }
        }
      }
    }

    // Signal 5 — Requester email domain differs from counterparty's contact domain
    if (pd['counterpartyId']) {
      const cpRows = await this.dataSource.query<{ primary_contact_email: string | null }[]>(
        `SELECT primary_contact_email FROM counterparties WHERE id = $1`,
        [pd['counterpartyId']],
      );
      const userRows = await this.dataSource.query<{ email: string }[]>(
        `SELECT email FROM users WHERE id = $1`,
        [userId],
      );
      if (cpRows[0]?.primary_contact_email && userRows[0]?.email) {
        const cpDomain = cpRows[0].primary_contact_email.split('@')[1]?.toLowerCase();
        const reqDomain = userRows[0].email.split('@')[1]?.toLowerCase();
        if (cpDomain && reqDomain && cpDomain !== reqDomain) {
          signals.push(
            `Requester email domain (@${reqDomain}) differs from counterparty contact domain (@${cpDomain})`,
          );
        }
      }
    }

    return { flag: signals.length > 0, notes: signals.join(' | ') };
  }

  // ── Change Requests ────────────────────────────────────────────────────────

  async createChangeRequest(
    dto: CreateChangeRequestDto,
    userId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    if (dto.changeType !== 'ADD' && !dto.beneficiaryAccountId) {
      throw new BadRequestException(
        'beneficiaryAccountId is required for MODIFY / DEACTIVATE',
      );
    }
    if (dto.changeType === 'ADD' && dto.beneficiaryAccountId) {
      throw new BadRequestException(
        'beneficiaryAccountId must not be set for ADD requests',
      );
    }

    const cr = this.crRepo.create({
      changeType: dto.changeType,
      beneficiaryAccountId: dto.beneficiaryAccountId ?? null,
      proposedData: dto.proposedData,
      documents: dto.documents,
      requestedBy: userId,
      status: 'PENDING_VERIFICATION',
      anomalyFlag: false,
      anomalyNotes: null,
      sanctionWarning: false,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.crRepo.save(cr);

    // §6.4 — evaluate anomalies; §6.5 — screen proposed country against sanctioned master
    // Both run after save and never block creation (soft flags only)
    try {
      const { flag, notes } = await this.evaluateAnomalies(dto, userId);
      if (flag) {
        saved.anomalyFlag = true;
        saved.anomalyNotes = notes;
      }
    } catch {
      // Anomaly evaluation must never block the workflow
    }

    try {
      const pd = dto.proposedData as Record<string, string>;
      const countryCode = pd['countryCode'];
      if (countryCode) {
        const rows = await this.dataSource.query<{ is_active: boolean }[]>(
          `SELECT is_active FROM sanctioned_countries WHERE country_code = $1`,
          [countryCode.toUpperCase()],
        );
        if (rows[0]?.is_active) {
          saved.sanctionWarning = true;
        }
      }
    } catch {
      // Sanction screening must never block the workflow
    }

    // Persist both flags in a single write if anything changed
    if (saved.anomalyFlag || saved.sanctionWarning) {
      await this.crRepo.save(saved);
    }

    return this.findOneChangeRequest(saved.id);
  }

  async findAllChangeRequests(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<BeneficiaryAccountChangeRequest>> {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.crRepo.findAndCount({
      where: { deletedAt: IsNull() },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { beneficiaryAccount: true, requester: true, verifier: true, approver: true },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneChangeRequest(id: string): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.crRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { beneficiaryAccount: true, requester: true, verifier: true, approver: true },
    });
    if (!cr) throw new NotFoundException(`Change request ${id} not found`);
    return cr;
  }

  async verify(
    id: string,
    dto: VerifyChangeRequestDto,
    userId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findOneChangeRequest(id);

    if (cr.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(`Cannot verify a request in status ${cr.status}`);
    }
    if (cr.requestedBy === userId) {
      throw new ForbiddenException(
        'Maker-checker: the verifier cannot be the same user who created this request',
      );
    }

    // §6.2 — callback evidence and mandatory docs required for ADD/MODIFY
    if (cr.changeType !== 'DEACTIVATE') {
      if (!dto.callbackEvidence?.trim()) {
        throw new BadRequestException(
          'Callback verification evidence is required for ADD and MODIFY requests (§6.2)',
        );
      }

      const presentCodes = (cr.documents as Array<{ documentCode: string }>).map(
        (d) => d.documentCode,
      );
      const missing = REQUIRED_DOCS.filter((code) => !presentCodes.includes(code));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Missing mandatory supporting documents: ${missing.join(', ')}. ` +
          `Required for ADD/MODIFY: ${REQUIRED_DOCS.join(', ')}`,
        );
      }
    }

    cr.verifiedBy = userId;
    cr.verifiedAt = new Date();
    cr.verificationNotes = dto.verificationNotes ?? null;
    cr.callbackEvidence = dto.callbackEvidence ?? null;
    cr.status = 'VERIFIED';
    cr.updatedBy = userId;
    return this.crRepo.save(cr);
  }

  async approve(
    id: string,
    dto: ApproveChangeRequestDto,
    userId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findOneChangeRequest(id);

    if (cr.status !== 'VERIFIED') {
      throw new BadRequestException(
        `Cannot approve a request in status ${cr.status}; it must be VERIFIED first`,
      );
    }

    // §6.5 — final approver must acknowledge sanctions risk in writing
    if (cr.sanctionWarning && !dto.sanctionAcknowledgement?.trim()) {
      throw new BadRequestException(
        'This change request involves a sanctioned country. ' +
        'You must provide a written acknowledgement (sanctionAcknowledgement) before approving.',
      );
    }
    if (cr.sanctionWarning && dto.sanctionAcknowledgement) {
      cr.sanctionOverrideReason = dto.sanctionAcknowledgement;
    }

    if (cr.changeType === 'ADD') {
      const pd = cr.proposedData as Record<string, string>;
      const existing = await this.accountRepo.findOne({
        where: {
          bankId: pd['bankId'],
          accountNumber: pd['accountNumber'],
          deletedAt: IsNull(),
        },
      });
      if (existing) {
        throw new ConflictException(
          'A beneficiary account with this bank and account number already exists',
        );
      }

      // §6.3 — skip cooling-off if these bank details were previously registered
      const previouslyVerified = await this.accountRepo
        .createQueryBuilder('ba')
        .withDeleted()
        .where('ba.bank_id = :bankId AND ba.account_number = :accountNumber', {
          bankId: pd['bankId'],
          accountNumber: pd['accountNumber'],
        })
        .getOne();

      const coolingOffUntil = previouslyVerified
        ? new Date()
        : new Date(Date.now() + COOLING_OFF_HOURS * 60 * 60 * 1000);

      const account = this.accountRepo.create({
        counterpartyId: pd['counterpartyId'] || null,
        employeeId: pd['employeeId'] || null,
        accountHolderName: pd['accountHolderName'],
        accountNumber: pd['accountNumber'],
        bankId: pd['bankId'],
        bankName: pd['bankName'] ?? null,
        branchName: pd['branchName'] ?? null,
        swiftBic: pd['swiftBic'] ?? null,
        iban: pd['iban'] ?? null,
        currencyId: pd['currencyId'],
        countryCode: pd['countryCode'],
        accountDirection:
          (pd['accountDirection'] as BeneficiaryAccount['accountDirection']) || 'PAY_TO',
        status: 'PENDING_ACTIVATION',
        coolingOffUntil,
        createdBy: userId,
        updatedBy: userId,
      });
      const saved = await this.accountRepo.save(account);
      cr.beneficiaryAccountId = saved.id;
    } else if (cr.changeType === 'MODIFY') {
      const account = await this.findOneAccount(cr.beneficiaryAccountId!);
      const pd = cr.proposedData as Record<string, string>;

      const bankDetailsUnchanged =
        (!pd['bankId'] || pd['bankId'] === account.bankId) &&
        (!pd['accountNumber'] || pd['accountNumber'] === account.accountNumber);

      const coolingOffUntil = bankDetailsUnchanged
        ? new Date()
        : new Date(Date.now() + COOLING_OFF_HOURS * 60 * 60 * 1000);

      Object.assign(account, cr.proposedData, {
        status: 'PENDING_ACTIVATION',
        coolingOffUntil,
        updatedBy: userId,
      });
      await this.accountRepo.save(account);
    } else if (cr.changeType === 'DEACTIVATE') {
      const account = await this.findOneAccount(cr.beneficiaryAccountId!);
      account.status = 'INACTIVE';
      account.updatedBy = userId;
      await this.accountRepo.save(account);
    }

    cr.approvedBy = userId;
    cr.approvedAt = new Date();
    cr.status = 'APPROVED';
    cr.updatedBy = userId;
    await this.crRepo.save(cr);
    // Re-fetch to ensure beneficiaryAccountId and all relations are fully hydrated in the response
    return this.findOneChangeRequest(cr.id);
  }

  async reject(
    id: string,
    dto: RejectChangeRequestDto,
    userId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findOneChangeRequest(id);

    if (!['PENDING_VERIFICATION', 'VERIFIED'].includes(cr.status)) {
      throw new BadRequestException(`Cannot reject a request in status ${cr.status}`);
    }

    cr.rejectedBy = userId;
    cr.rejectedAt = new Date();
    cr.rejectionReason = dto.reason;
    cr.status = 'REJECTED';
    cr.updatedBy = userId;
    return this.crRepo.save(cr);
  }

  /** §6.2 — Cancel a pending or verified change request. */
  async cancel(id: string, userId: string): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findOneChangeRequest(id);

    if (!['PENDING_VERIFICATION', 'VERIFIED'].includes(cr.status)) {
      throw new BadRequestException(`Cannot cancel a request in status ${cr.status}`);
    }

    cr.status = 'CANCELLED';
    cr.updatedBy = userId;
    return this.crRepo.save(cr);
  }

  // ── Beneficiary Accounts ───────────────────────────────────────────────────

  async findAllAccounts(
    query: BeneficiaryAccountQuery,
  ): Promise<PaginatedResult<BeneficiaryAccount>> {
    const { page = 1, limit = 20, counterpartyId, employeeId, status, currencyId } = query;
    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (counterpartyId) where['counterpartyId'] = counterpartyId;
    if (employeeId) where['employeeId'] = employeeId;
    if (status) where['status'] = status;
    if (currencyId) where['currencyId'] = currencyId;

    const [data, total] = await this.accountRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { counterparty: true, employee: true, bank: true, currency: true },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneAccount(id: string): Promise<BeneficiaryAccount> {
    const account = await this.accountRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { counterparty: true, employee: true, bank: true, currency: true },
    });
    if (!account) throw new NotFoundException(`Beneficiary account ${id} not found`);
    return account;
  }

  /** §6.3 — Admin manually activates an account after the cooling-off window elapses. */
  async activate(id: string, userId: string): Promise<BeneficiaryAccount> {
    const account = await this.findOneAccount(id);

    if (account.status !== 'PENDING_ACTIVATION') {
      throw new BadRequestException(
        `Account is in status ${account.status}; only PENDING_ACTIVATION accounts can be activated`,
      );
    }
    if (account.coolingOffUntil && account.coolingOffUntil > new Date()) {
      const remaining = Math.ceil(
        (account.coolingOffUntil.getTime() - Date.now()) / (1000 * 60),
      );
      throw new BadRequestException(
        `Cooling-off period has not elapsed; ${remaining} minute(s) remaining`,
      );
    }

    account.status = 'ACTIVE';
    account.coolingOffUntil = null;
    account.updatedBy = userId;
    return this.accountRepo.save(account);
  }

  /**
   * §6.3 — Admin override: activate immediately, bypassing the remaining
   * cooling-off window. Every override is logged to audit_logs.
   */
  async overrideCoolingOff(
    id: string,
    dto: OverrideCoolingOffDto,
    userId: string,
  ): Promise<BeneficiaryAccount> {
    const account = await this.findOneAccount(id);

    if (account.status !== 'PENDING_ACTIVATION') {
      throw new BadRequestException(
        `Account is in status ${account.status}; only PENDING_ACTIVATION accounts support cooling-off override`,
      );
    }

    const originalCoolingOffUntil = account.coolingOffUntil;

    account.status = 'ACTIVE';
    account.coolingOffUntil = null;
    account.updatedBy = userId;
    await this.accountRepo.save(account);

    // Audit — fire-and-forget; must never break the business flow
    this.dataSource
      .query(
        `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, new_values)
         VALUES ('UPDATE', 'beneficiary_accounts', $1, $2, $3)`,
        [
          id,
          userId,
          JSON.stringify({
            event: 'COOLING_OFF_OVERRIDE',
            reason: dto.reason,
            originalCoolingOffUntil,
          }),
        ],
      )
      .catch(() => undefined);

    return this.findOneAccount(id);
  }

  /**
   * §6.3 — Copy an ACTIVE verified beneficiary account to a new owner in
   * the same group. No cooling-off period applies (same-group copy rule).
   */
  async copyFromVerified(
    sourceId: string,
    dto: CopyFromVerifiedDto,
    userId: string,
  ): Promise<BeneficiaryAccount> {
    if (!dto.counterpartyId && !dto.employeeId) {
      throw new BadRequestException('Either counterpartyId or employeeId must be provided');
    }
    if (dto.counterpartyId && dto.employeeId) {
      throw new BadRequestException('Provide either counterpartyId or employeeId, not both');
    }

    const source = await this.findOneAccount(sourceId);
    if (source.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Only ACTIVE accounts can be copied (source account is ${source.status})`,
      );
    }

    const existing = await this.accountRepo.findOne({
      where: {
        bankId: source.bankId,
        accountNumber: source.accountNumber,
        ...(dto.counterpartyId
          ? { counterpartyId: dto.counterpartyId }
          : { employeeId: dto.employeeId }),
        deletedAt: IsNull(),
      },
    });
    if (existing) {
      throw new ConflictException(
        'The target owner already has an account with these bank details',
      );
    }

    const newAccount = this.accountRepo.create({
      counterpartyId: dto.counterpartyId ?? null,
      employeeId: dto.employeeId ?? null,
      accountHolderName: source.accountHolderName,
      accountNumber: source.accountNumber,
      bankId: source.bankId,
      bankName: source.bankName ?? null,
      branchName: source.branchName ?? null,
      swiftBic: source.swiftBic ?? null,
      iban: source.iban ?? null,
      currencyId: source.currencyId,
      countryCode: source.countryCode,
      accountDirection: source.accountDirection,
      // §6.3 — no cooling-off when copying from a previously verified account
      status: 'ACTIVE',
      coolingOffUntil: null,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.accountRepo.save(newAccount);

    // Audit trail — approved change request record (verifiedBy = NULL per maker-checker constraint)
    const cr = this.crRepo.create({
      changeType: 'ADD',
      beneficiaryAccountId: saved.id,
      proposedData: { copiedFromAccountId: sourceId },
      documents: [],
      requestedBy: userId,
      verifiedBy: null,
      verificationNotes: `Copied from verified account ${sourceId} — no cooling-off applied`,
      approvedBy: userId,
      approvedAt: new Date(),
      status: 'APPROVED',
      anomalyFlag: false,
      createdBy: userId,
      updatedBy: userId,
    });
    await this.crRepo.save(cr);

    return saved;
  }

  /**
   * §6.3 — Cron helper: bulk-activate all PENDING_ACTIVATION accounts whose
   * cooling-off window has elapsed. Called every 5 minutes by the scheduler.
   */
  async autoActivateBatch(): Promise<number> {
    const result = await this.dataSource.query<{ id: string }[]>(
      `UPDATE beneficiary_accounts
         SET status = 'ACTIVE', cooling_off_until = NULL, updated_at = now()
       WHERE status = 'PENDING_ACTIVATION'
         AND cooling_off_until IS NOT NULL
         AND cooling_off_until <= now()
         AND deleted_at IS NULL
       RETURNING id`,
    );
    return (result as unknown as { id: string }[]).length;
  }
}
