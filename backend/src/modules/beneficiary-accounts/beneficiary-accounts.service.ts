import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BeneficiaryAccount } from './beneficiary-account.entity';
import { BeneficiaryAccountChangeRequest } from './beneficiary-account-change-request.entity';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { VerifyChangeRequestDto } from './dto/verify-change-request.dto';
import { ApproveChangeRequestDto, RejectChangeRequestDto } from './dto/action-change-request.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

export interface BeneficiaryAccountQuery extends PaginationQueryDto {
  counterpartyId?: string;
  employeeId?: string;
  status?: string;
  currencyId?: string;
  search?: string;
}

/** Cooling-off window in hours (§5.4c / §6.3 default: 24h). Configurable via EBAC_COOLING_OFF_HOURS env var. */
const COOLING_OFF_HOURS = parseInt(process.env.EBAC_COOLING_OFF_HOURS ?? '24', 10);

@Injectable()
export class BeneficiaryAccountsService {
  constructor(
    @InjectRepository(BeneficiaryAccount)
    private readonly accountRepo: Repository<BeneficiaryAccount>,

    @InjectRepository(BeneficiaryAccountChangeRequest)
    private readonly crRepo: Repository<BeneficiaryAccountChangeRequest>,
  ) {}

  // -----------------------------------------------------------------------
  // Change Requests
  // -----------------------------------------------------------------------

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
      createdBy: userId,
      updatedBy: userId,
    });
    return this.crRepo.save(cr);
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
      throw new BadRequestException(
        `Cannot verify a request in status ${cr.status}`,
      );
    }
    if (cr.requestedBy === userId) {
      throw new ForbiddenException(
        'Maker-checker: the verifier cannot be the same user who created this request',
      );
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

    if (cr.changeType === 'ADD') {
      const pd = cr.proposedData as Record<string, string>;
      // Check for duplicate account number in same bank (non-deleted records only).
      const existing = await this.accountRepo.findOne({
        where: { bankId: pd['bankId'] as string, accountNumber: pd['accountNumber'] as string, deletedAt: IsNull() },
      });
      if (existing) {
        throw new ConflictException(
          `A beneficiary account with this bank and account number already exists`,
        );
      }

      // §3 step 7 — Skip cooling-off if these bank account details were
      // previously registered and verified (now soft-deleted or inactive).
      const previouslyVerified = await this.accountRepo
        .createQueryBuilder('ba')
        .withDeleted()
        .where('ba.bank_id = :bankId AND ba.account_number = :accountNumber', {
          bankId: pd['bankId'],
          accountNumber: pd['accountNumber'],
        })
        .getOne();

      const coolingOffUntil = previouslyVerified
        ? new Date() // Details already known — no cooling-off window
        : new Date(Date.now() + COOLING_OFF_HOURS * 60 * 60 * 1000);

      const account = this.accountRepo.create({
        counterpartyId: (pd['counterpartyId'] as string) || null,
        employeeId: (pd['employeeId'] as string) || null,
        accountHolderName: pd['accountHolderName'] as string,
        accountNumber: pd['accountNumber'] as string,
        bankId: pd['bankId'] as string,
        bankName: pd['bankName'] as string | undefined,
        branchName: pd['branchName'] as string | undefined,
        swiftBic: pd['swiftBic'] as string | undefined,
        iban: pd['iban'] as string | undefined,
        currencyId: pd['currencyId'] as string,
        countryCode: pd['countryCode'] as string,
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

      // §3 step 7 — If the bank account number is unchanged the details
      // are already verified; no cooling-off required.
      const bankDetailsUnchanged =
        (!pd['bankId'] || pd['bankId'] === account.bankId) &&
        (!pd['accountNumber'] || pd['accountNumber'] === account.accountNumber);

      const coolingOffUntil = bankDetailsUnchanged
        ? new Date() // Already verified — skip cooling-off
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
    return this.crRepo.save(cr);
  }

  async reject(
    id: string,
    dto: RejectChangeRequestDto,
    userId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findOneChangeRequest(id);

    if (!['PENDING_VERIFICATION', 'VERIFIED'].includes(cr.status)) {
      throw new BadRequestException(
        `Cannot reject a request in status ${cr.status}`,
      );
    }

    cr.rejectedBy = userId;
    cr.rejectedAt = new Date();
    cr.rejectionReason = dto.reason;
    cr.status = 'REJECTED';
    cr.updatedBy = userId;
    return this.crRepo.save(cr);
  }

  // -----------------------------------------------------------------------
  // Beneficiary Accounts
  // -----------------------------------------------------------------------

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

  /**
   * §6.3 — Admin manually activates an account after the cooling-off
   * window has elapsed. Enforces that the window has actually passed.
   */
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
}
