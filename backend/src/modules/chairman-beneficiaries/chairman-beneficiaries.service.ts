import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ChairmanBeneficiary } from './chairman-beneficiary.entity';
import { ChairmanBeneficiaryChangeRequest } from './chairman-beneficiary-change-request.entity';
import { CreateChairmanCrDto } from './dto/create-chairman-cr.dto';
import { VerifyChairmanCrDto } from './dto/verify-chairman-cr.dto';
import {
  ApproveChairmanCrDto,
  RejectChairmanCrDto,
} from './dto/action-chairman-cr.dto';
import { ChairmanOverrideCoolingOffDto } from './dto/override-cooling-off.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

/** Cooling-off window in hours (§9, same default as §6.3: 24 h). */
const COOLING_OFF_HOURS = parseInt(process.env.EBAC_COOLING_OFF_HOURS ?? '24', 10);

/** Required supporting documents for ADD/MODIFY requests (§9, mirrors §6.2). */
const REQUIRED_DOCS = ['CANCELLED_CHEQUE', 'BANK_LETTER', 'SOURCE_CORRESPONDENCE'];

// ── Levenshtein helper (Signal 1) ───────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

export interface ChairmanBeneficiaryQuery extends PaginationQueryDto {
  status?: string;
  currencyId?: string;
}

@Injectable()
export class ChairmanBeneficiariesService {
  constructor(
    @InjectRepository(ChairmanBeneficiary)
    private readonly accountRepo: Repository<ChairmanBeneficiary>,

    @InjectRepository(ChairmanBeneficiaryChangeRequest)
    private readonly crRepo: Repository<ChairmanBeneficiaryChangeRequest>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ── §9 Anomaly detection ───────────────────────────────────────────────────

  private async evaluateAnomalies(
    dto: CreateChairmanCrDto,
  ): Promise<{ flag: boolean; notes: string }> {
    if (dto.changeType === 'DEACTIVATE') return { flag: false, notes: '' };

    const pd = dto.proposedData as Record<string, string>;
    const signals: string[] = [];

    // Signal 1 — Similar account number (Levenshtein distance 1–2)
    const newAccNum = pd['accountNumber'] ?? '';
    if (newAccNum) {
      const rows = await this.dataSource.query<{ account_number: string }[]>(
        `SELECT account_number FROM chairman_beneficiaries WHERE deleted_at IS NULL`,
      );
      for (const row of rows) {
        const dist = levenshtein(row.account_number, newAccNum);
        if (dist > 0 && dist <= 2) {
          signals.push(
            `Account number is very similar to existing chairman account ending ` +
            `${row.account_number.slice(-4)} (edit distance ${dist})`,
          );
        }
      }
    }

    // Signal 3 — Multiple active changes to same beneficiary in last 30 days
    if (dto.chairmanBeneficiaryId) {
      const rows = await this.dataSource.query<{ cnt: string }[]>(
        `SELECT COUNT(*) AS cnt FROM chairman_beneficiary_change_requests
         WHERE chairman_beneficiary_id = $1
           AND status NOT IN ('REJECTED','CANCELLED')
           AND created_at > now() - INTERVAL '30 days'
           AND deleted_at IS NULL`,
        [dto.chairmanBeneficiaryId],
      );
      const cnt = parseInt(rows[0]?.cnt ?? '0', 10);
      if (cnt > 0) {
        signals.push(
          `${cnt} other active change request(s) exist for this beneficiary in the last 30 days`,
        );
      }
    }

    // Signal 4 — Pending chairman payment > 3× historical average after a change
    const avgRows = await this.dataSource.query<{ avg_minor: string | null }[]>(
      `SELECT AVG(amount_minor) AS avg_minor
       FROM (
         SELECT amount_minor FROM payment_requests
         WHERE is_chairman_payment = TRUE
           AND status = 'AWAITING_PAYMENT_CONFIRMATION'
           AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 5
       ) t`,
    );
    const avgMinor = parseFloat(avgRows[0]?.avg_minor ?? '0');
    if (avgMinor > 0) {
      const pendingRows = await this.dataSource.query<
        { amount_minor: string; request_number: string }[]
      >(
        `SELECT amount_minor, request_number FROM payment_requests
         WHERE is_chairman_payment = TRUE
           AND status IN ('DRAFT','AWAITING_MAKER_PREP','AWAITING_CHECKER_REVIEW','AWAITING_HEAD_APPROVAL')
           AND deleted_at IS NULL`,
      );
      for (const pr of pendingRows) {
        if (parseFloat(pr.amount_minor) > avgMinor * 3) {
          signals.push(
            `Pending chairman payment ${pr.request_number} is more than 3× the historical average`,
          );
        }
      }
    }

    return { flag: signals.length > 0, notes: signals.join(' | ') };
  }

  // ── Change Requests ────────────────────────────────────────────────────────

  async createChangeRequest(
    dto: CreateChairmanCrDto,
    userId: string,
  ): Promise<ChairmanBeneficiaryChangeRequest> {
    if (dto.changeType !== 'ADD' && !dto.chairmanBeneficiaryId) {
      throw new BadRequestException(
        'chairmanBeneficiaryId is required for MODIFY / DEACTIVATE',
      );
    }
    if (dto.changeType === 'ADD' && dto.chairmanBeneficiaryId) {
      throw new BadRequestException(
        'chairmanBeneficiaryId must not be set for ADD requests',
      );
    }

    const cr = this.crRepo.create({
      changeType: dto.changeType,
      chairmanBeneficiaryId: dto.chairmanBeneficiaryId ?? null,
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

    // §9 — evaluate anomalies; §6.5 — screen proposed country against sanctioned master
    // Both run after save and never block creation (soft flags only)
    try {
      const { flag, notes } = await this.evaluateAnomalies(dto);
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

    if (saved.anomalyFlag || saved.sanctionWarning) {
      await this.crRepo.save(saved);
    }

    return this.findOneChangeRequest(saved.id);
  }

  async findAllChangeRequests(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<ChairmanBeneficiaryChangeRequest>> {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.crRepo.findAndCount({
      where: { deletedAt: IsNull() },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { chairmanBeneficiary: true, requester: true, verifier: true, approver: true },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneChangeRequest(id: string): Promise<ChairmanBeneficiaryChangeRequest> {
    const cr = await this.crRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { chairmanBeneficiary: true, requester: true, verifier: true, approver: true },
    });
    if (!cr) throw new NotFoundException(`Chairman beneficiary change request ${id} not found`);
    return cr;
  }

  async verify(
    id: string,
    dto: VerifyChairmanCrDto,
    userId: string,
  ): Promise<ChairmanBeneficiaryChangeRequest> {
    const cr = await this.findOneChangeRequest(id);

    if (cr.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(`Cannot verify a request in status ${cr.status}`);
    }
    if (cr.requestedBy === userId) {
      throw new ForbiddenException(
        'Maker-checker: the verifier cannot be the same user who created this request',
      );
    }

    // §9 / §6.2 — callback evidence and mandatory docs required for ADD/MODIFY
    if (cr.changeType !== 'DEACTIVATE') {
      if (!dto.callbackEvidence?.trim()) {
        throw new BadRequestException(
          'Callback verification evidence is required for ADD and MODIFY requests',
        );
      }

      const presentCodes = (cr.documents as Array<{ documentCode: string }>).map(
        (d) => d.documentCode,
      );
      const missing = REQUIRED_DOCS.filter((code) => !presentCodes.includes(code));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Missing mandatory supporting documents: ${missing.join(', ')}. ` +
          `Required: ${REQUIRED_DOCS.join(', ')}`,
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
    dto: ApproveChairmanCrDto,
    userId: string,
  ): Promise<ChairmanBeneficiaryChangeRequest> {
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
          'A chairman beneficiary with this bank and account number already exists',
        );
      }

      // §9 — skip cooling-off if bank details were previously registered
      const previouslyVerified = await this.accountRepo
        .createQueryBuilder('cb')
        .withDeleted()
        .where('cb.bank_id = :bankId AND cb.account_number = :accountNumber', {
          bankId: pd['bankId'],
          accountNumber: pd['accountNumber'],
        })
        .getOne();

      const coolingOffUntil = previouslyVerified
        ? new Date()
        : new Date(Date.now() + COOLING_OFF_HOURS * 60 * 60 * 1000);

      const account = this.accountRepo.create({
        accountHolderName: pd['accountHolderName'],
        accountNumber: pd['accountNumber'],
        bankId: pd['bankId'],
        bankName: pd['bankName'] ?? null,
        branchName: pd['branchName'] ?? null,
        swiftBic: pd['swiftBic'] ?? null,
        iban: pd['iban'] ?? null,
        currencyId: pd['currencyId'],
        countryCode: pd['countryCode'],
        status: 'PENDING_ACTIVATION',
        coolingOffUntil,
        createdBy: userId,
        updatedBy: userId,
      });
      const saved = await this.accountRepo.save(account);
      cr.chairmanBeneficiaryId = saved.id;
    } else if (cr.changeType === 'MODIFY') {
      const account = await this.findOneAccount(cr.chairmanBeneficiaryId!);
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
      const account = await this.findOneAccount(cr.chairmanBeneficiaryId!);
      account.status = 'INACTIVE';
      account.updatedBy = userId;
      await this.accountRepo.save(account);
    }

    cr.approvedBy = userId;
    cr.approvedAt = new Date();
    cr.status = 'APPROVED';
    cr.updatedBy = userId;
    await this.crRepo.save(cr);
    return this.findOneChangeRequest(cr.id);
  }

  async reject(
    id: string,
    dto: RejectChairmanCrDto,
    userId: string,
  ): Promise<ChairmanBeneficiaryChangeRequest> {
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

  async cancel(id: string, userId: string): Promise<ChairmanBeneficiaryChangeRequest> {
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
    query: ChairmanBeneficiaryQuery,
  ): Promise<PaginatedResult<ChairmanBeneficiary>> {
    const { page = 1, limit = 20, status, currencyId } = query;
    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (status) where['status'] = status;
    if (currencyId) where['currencyId'] = currencyId;

    const [data, total] = await this.accountRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { bank: true, currency: true },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneAccount(id: string): Promise<ChairmanBeneficiary> {
    const account = await this.accountRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { bank: true, currency: true },
    });
    if (!account) throw new NotFoundException(`Chairman beneficiary ${id} not found`);
    return account;
  }

  /** §9 — Activate a PENDING_ACTIVATION beneficiary after cooling-off elapses. */
  async activate(id: string, userId: string): Promise<ChairmanBeneficiary> {
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

  /** §9 — Admin force-activates, bypassing remaining cooling-off window. */
  async overrideCoolingOff(
    id: string,
    dto: ChairmanOverrideCoolingOffDto,
    userId: string,
  ): Promise<ChairmanBeneficiary> {
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

    // Audit — fire-and-forget
    this.dataSource
      .query(
        `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, new_values)
         VALUES ('UPDATE', 'chairman_beneficiaries', $1, $2, $3)`,
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
   * §9 — Cron helper: bulk-activate all PENDING_ACTIVATION beneficiaries
   * whose cooling-off window has elapsed.
   */
  async autoActivateBatch(): Promise<number> {
    try {
      const result = await this.dataSource.query<{ id: string }[]>(
        `UPDATE chairman_beneficiaries
           SET status = 'ACTIVE', cooling_off_until = NULL, updated_at = now()
         WHERE status = 'PENDING_ACTIVATION'
           AND cooling_off_until IS NOT NULL
           AND cooling_off_until <= now()
           AND deleted_at IS NULL
         RETURNING id`,
      );
      return (result as unknown as { id: string }[]).length;
    } catch (err: unknown) {
      // Migration not yet applied — table doesn't exist; treat as zero activations.
      if ((err as { code?: string }).code === '42P01') return 0;
      throw err;
    }
  }
}
