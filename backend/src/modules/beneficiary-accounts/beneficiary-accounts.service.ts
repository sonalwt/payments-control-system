import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BeneficiaryAccount } from './beneficiary-account.entity';
import { BeneficiaryAccountChangeRequest } from './beneficiary-account-change-request.entity';
import {
  ApproveChangeRequestDto,
  CreateChangeRequestDto,
  RejectChangeRequestDto,
  VerifyChangeRequestDto,
} from './dto/create-change-request.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

/** SoW §6.3 — default cooling-off window after a beneficiary change. */
const DEFAULT_COOLING_OFF_HOURS = 24;

@Injectable()
export class BeneficiaryAccountsService {
  constructor(
    @InjectRepository(BeneficiaryAccount)
    private readonly repo: Repository<BeneficiaryAccount>,
    @InjectRepository(BeneficiaryAccountChangeRequest)
    private readonly crRepo: Repository<BeneficiaryAccountChangeRequest>,
    private readonly dataSource: DataSource,
  ) {}

  // -------------------------------------------------------------------
  // Beneficiary accounts (read-only — every mutation flows via a CR)
  // -------------------------------------------------------------------

  async findAll(
    query: PaginationQueryDto & {
      counterpartyId?: string;
      employeeId?: string;
      status?: string;
      payableOnly?: string;
    },
  ): Promise<PaginatedResult<BeneficiaryAccount>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.counterparty', 'counterparty')
      .leftJoinAndSelect('b.employee', 'employee')
      .leftJoinAndSelect('b.bank', 'bank')
      .leftJoinAndSelect('b.currency', 'currency')
      .leftJoinAndSelect('b.country', 'country')
      .orderBy('b.accountHolderName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.counterpartyId) {
      qb.andWhere('b.counterparty_id = :cp', { cp: query.counterpartyId });
    }
    if (query.employeeId) {
      qb.andWhere('b.employee_id = :emp', { emp: query.employeeId });
    }
    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }
    if (query.payableOnly === 'true') {
      // §6.1 — only ACTIVE accounts whose cooling-off window has elapsed.
      qb.andWhere("b.status = 'ACTIVE'");
      qb.andWhere('(b.cooling_off_until IS NULL OR b.cooling_off_until <= now())');
    }
    if (search) {
      qb.andWhere(
        '(b.account_holder_name ILIKE :s OR b.account_number ILIKE :s OR b.iban ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<BeneficiaryAccount> {
    const b = await this.repo.findOne({
      where: { id },
      relations: ['counterparty', 'employee', 'bank', 'currency', 'country'],
    });
    if (!b) throw new NotFoundException(`Beneficiary account ${id} not found`);
    return b;
  }

  /**
   * SoW §6.1 — Selectable for payment iff ACTIVE and any cooling-off
   * window has elapsed. Called by the payment-requests service before
   * allowing the maker to attach a destination account.
   */
  isPayable(b: BeneficiaryAccount): boolean {
    if (b.status !== 'ACTIVE') return false;
    if (b.coolingOffUntil && b.coolingOffUntil.getTime() > Date.now()) return false;
    return true;
  }

  // -------------------------------------------------------------------
  // Change requests
  // -------------------------------------------------------------------

  async createChangeRequest(
    dto: CreateChangeRequestDto,
    actorId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    // Shape validation
    if (dto.changeType === 'ADD' && dto.beneficiaryAccountId) {
      throw new BadRequestException('ADD must not target an existing beneficiary');
    }
    if (dto.changeType !== 'ADD' && !dto.beneficiaryAccountId) {
      throw new BadRequestException(
        `${dto.changeType} requires beneficiaryAccountId`,
      );
    }
    if (dto.beneficiaryAccountId) {
      await this.findOne(dto.beneficiaryAccountId);
    }

    if (dto.changeType === 'ADD') {
      this.validateAddPayload(dto.proposedData);
    }

    const cr = this.crRepo.create({
      beneficiaryAccountId: dto.beneficiaryAccountId ?? null,
      changeType: dto.changeType,
      proposedData: dto.proposedData,
      documents: dto.documents.map((d) => ({
        code: d.code,
        label: d.label,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        mimeType: d.mimeType ?? null,
      })),
      status: 'PENDING_VERIFICATION',
      requestedBy: actorId,
      requestedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.crRepo.save(cr);
  }

  async listChangeRequests(
    query: PaginationQueryDto & { status?: string },
  ): Promise<PaginatedResult<BeneficiaryAccountChangeRequest>> {
    const { page = 1, limit = 20 } = query;
    const qb = this.crRepo
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.beneficiaryAccount', 'ba')
      .leftJoinAndSelect('cr.requestedByUser', 'requestedByUser')
      .leftJoinAndSelect('cr.verifiedByUser', 'verifiedByUser')
      .leftJoinAndSelect('cr.approvedByUser', 'approvedByUser')
      .orderBy('cr.requested_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.status) {
      qb.andWhere('cr.status = :status', { status: query.status });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findChangeRequest(id: string): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.crRepo.findOne({
      where: { id },
      relations: [
        'beneficiaryAccount',
        'requestedByUser',
        'verifiedByUser',
        'approvedByUser',
        'rejectedByUser',
      ],
    });
    if (!cr) throw new NotFoundException(`Change request ${id} not found`);
    return cr;
  }

  async verifyChangeRequest(
    id: string,
    dto: VerifyChangeRequestDto,
    actorId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findChangeRequest(id);
    if (cr.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(`Cannot verify in status ${cr.status}`);
    }
    // §6.2 — maker cannot be the verifier (also enforced by DB CHECK)
    if (cr.requestedBy === actorId) {
      throw new ForbiddenException(
        'The user who raised the change request cannot verify it.',
      );
    }
    cr.verifiedBy = actorId;
    cr.verifiedAt = new Date();
    cr.verificationNotes = dto.verificationNotes ?? null;
    cr.callbackEvidence = dto.callbackEvidence;
    cr.status = 'VERIFIED';
    cr.updatedBy = actorId;
    return this.crRepo.save(cr);
  }

  async approveChangeRequest(
    id: string,
    dto: ApproveChangeRequestDto,
    actorId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findChangeRequest(id);
    if (cr.status !== 'VERIFIED') {
      throw new BadRequestException(`Cannot approve in status ${cr.status}`);
    }
    if (cr.requestedBy === actorId) {
      throw new ForbiddenException(
        'The user who raised the change request cannot approve it.',
      );
    }

    if (dto.coolingOffOverride && !dto.coolingOffOverrideReason) {
      throw new BadRequestException(
        'Cooling-off override requires a reason.',
      );
    }

    return this.dataSource.transaction(async (em) => {
      cr.approvedBy = actorId;
      cr.approvedAt = new Date();
      cr.coolingOffOverride = dto.coolingOffOverride ?? false;
      cr.coolingOffOverrideReason = dto.coolingOffOverrideReason ?? null;
      cr.status = 'APPROVED';
      cr.updatedBy = actorId;
      await em.save(cr);

      const coolingOffUntil = cr.coolingOffOverride
        ? null
        : new Date(Date.now() + DEFAULT_COOLING_OFF_HOURS * 3600 * 1000);

      switch (cr.changeType) {
        case 'ADD': {
          const data = cr.proposedData as Record<string, unknown>;
          const newAcc = em.create(BeneficiaryAccount, {
            counterpartyId: (data.counterpartyId as string | null) ?? null,
            employeeId: (data.employeeId as string | null) ?? null,
            accountHolderName: data.accountHolderName as string,
            accountNumber: data.accountNumber as string,
            bankId: data.bankId as string,
            branchName: (data.branchName as string | null) ?? null,
            swiftBic: (data.swiftBic as string | null) ?? null,
            iban: (data.iban as string | null) ?? null,
            currencyId: data.currencyId as string,
            countryId: data.countryId as string,
            accountDirection:
              (data.accountDirection as 'PAY_TO' | 'RECEIVE_FROM' | 'BOTH') ?? 'PAY_TO',
            status: 'ACTIVE',
            coolingOffUntil,
            createdBy: actorId,
            updatedBy: actorId,
          });
          const saved = await em.save(newAcc);
          cr.beneficiaryAccountId = saved.id;
          await em.save(cr);
          break;
        }
        case 'MODIFY': {
          if (!cr.beneficiaryAccountId) throw new BadRequestException('MODIFY missing target');
          const acc = await em.findOne(BeneficiaryAccount, {
            where: { id: cr.beneficiaryAccountId },
          });
          if (!acc) throw new NotFoundException('Target beneficiary not found');
          const data = cr.proposedData as Record<string, unknown>;
          Object.assign(acc, {
            accountHolderName: data.accountHolderName ?? acc.accountHolderName,
            accountNumber: data.accountNumber ?? acc.accountNumber,
            bankId: data.bankId ?? acc.bankId,
            branchName: data.branchName ?? acc.branchName,
            swiftBic: data.swiftBic ?? acc.swiftBic,
            iban: data.iban ?? acc.iban,
            currencyId: data.currencyId ?? acc.currencyId,
            countryId: data.countryId ?? acc.countryId,
            accountDirection: data.accountDirection ?? acc.accountDirection,
            status: 'ACTIVE',
            coolingOffUntil,
            updatedBy: actorId,
          });
          await em.save(acc);
          break;
        }
        case 'DEACTIVATE': {
          if (!cr.beneficiaryAccountId) throw new BadRequestException('DEACTIVATE missing target');
          const acc = await em.findOne(BeneficiaryAccount, {
            where: { id: cr.beneficiaryAccountId },
          });
          if (!acc) throw new NotFoundException('Target beneficiary not found');
          acc.status = 'INACTIVE';
          acc.updatedBy = actorId;
          await em.save(acc);
          break;
        }
      }

      return cr;
    });
  }

  async rejectChangeRequest(
    id: string,
    dto: RejectChangeRequestDto,
    actorId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findChangeRequest(id);
    if (cr.status !== 'PENDING_VERIFICATION' && cr.status !== 'VERIFIED') {
      throw new BadRequestException(`Cannot reject in status ${cr.status}`);
    }
    cr.rejectedBy = actorId;
    cr.rejectedAt = new Date();
    cr.rejectionReason = dto.reason;
    cr.status = 'REJECTED';
    cr.updatedBy = actorId;
    return this.crRepo.save(cr);
  }

  async cancelChangeRequest(
    id: string,
    actorId: string,
  ): Promise<BeneficiaryAccountChangeRequest> {
    const cr = await this.findChangeRequest(id);
    if (cr.status === 'APPROVED' || cr.status === 'REJECTED' || cr.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot cancel in status ${cr.status}`);
    }
    if (cr.requestedBy !== actorId) {
      throw new ForbiddenException('Only the requester can cancel');
    }
    cr.status = 'CANCELLED';
    cr.updatedBy = actorId;
    return this.crRepo.save(cr);
  }

  // -------------------------------------------------------------------

  private validateAddPayload(data: Record<string, unknown>): void {
    const required = [
      'accountHolderName',
      'accountNumber',
      'bankId',
      'currencyId',
      'countryId',
    ];
    for (const key of required) {
      if (!data[key]) {
        throw new BadRequestException(`ADD: proposedData.${key} is required`);
      }
    }
    if (!data.counterpartyId && !data.employeeId) {
      throw new BadRequestException(
        'ADD: proposedData must include exactly one of counterpartyId / employeeId',
      );
    }
    if (data.counterpartyId && data.employeeId) {
      throw new BadRequestException(
        'ADD: proposedData must include exactly one of counterpartyId / employeeId (not both)',
      );
    }
    // Conflict on the natural key (bank + account number) is enforced
    // by uq_bene_bank_account_live and surfaces as a 23505 from Postgres
    // when approval creates the row.
  }
}
