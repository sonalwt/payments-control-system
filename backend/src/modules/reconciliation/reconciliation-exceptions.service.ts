import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReconciliationException,
  ReconciliationExceptionStatus,
  ReconciliationExceptionType,
} from './reconciliation-exception.entity';
import { ReconciliationMatcherService } from './reconciliation-matcher.service';
import {
  ConfirmExceptionDto,
  ResolveExceptionDto,
  StartInvestigationDto,
} from './dto/exception-action.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface ExceptionQuery extends PaginationQueryDto {
  status?: ReconciliationExceptionStatus;
  exceptionType?: ReconciliationExceptionType;
  bankAccountId?: string;
  statementUploadId?: string;
}

/**
 * SOW §8.3 — workflow:
 *   OPEN --start-investigation--> UNDER_INVESTIGATION
 *   OPEN | UNDER_INVESTIGATION --resolve--> RESOLVED_WITH_JUSTIFICATION (terminal)
 *   OPEN | UNDER_INVESTIGATION --confirm--> CONFIRMED_EXCEPTION (terminal)
 *
 * Resolution note mandatory on closure (resolve / confirm).
 */
@Injectable()
export class ReconciliationExceptionsService {
  constructor(
    @InjectRepository(ReconciliationException)
    private readonly repo: Repository<ReconciliationException>,
    private readonly matcher: ReconciliationMatcherService,
  ) {}

  async findAll(
    query: ExceptionQuery,
  ): Promise<PaginatedResult<ReconciliationException>> {
    const {
      page = 1,
      limit = 20,
      status,
      exceptionType,
      bankAccountId,
      statementUploadId,
    } = query;

    const qb = this.repo
      .createQueryBuilder('re')
      .leftJoinAndSelect('re.bankAccount', 'ba')
      .leftJoinAndSelect('ba.bank', 'bank')
      .leftJoinAndSelect('ba.currency', 'currency')
      .leftJoinAndSelect('re.statementLine', 'sl')
      .leftJoinAndSelect('re.statementUpload', 'su')
      .orderBy('re.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('re.status = :status', { status });
    if (exceptionType) qb.andWhere('re.exceptionType = :exceptionType', { exceptionType });
    if (bankAccountId) qb.andWhere('re.bankAccountId = :bankAccountId', { bankAccountId });
    if (statementUploadId)
      qb.andWhere('re.statementUploadId = :statementUploadId', { statementUploadId });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findOne(id: string): Promise<ReconciliationException> {
    return this.requireById(id);
  }

  async startInvestigation(
    id: string,
    dto: StartInvestigationDto,
    userId: string,
  ): Promise<ReconciliationException> {
    const ex = await this.requireById(id);
    this.assertOpen(ex);
    ex.status = 'UNDER_INVESTIGATION';
    ex.investigatedBy = userId;
    ex.investigatedAt = new Date();
    if (dto.note) {
      ex.resolutionNote = ex.resolutionNote
        ? `${ex.resolutionNote}\n[investigation] ${dto.note}`
        : `[investigation] ${dto.note}`;
    }
    const saved = await this.repo.save(ex);
    await this.matcher.recountUpload(ex.statementUploadId);
    return saved;
  }

  async resolve(
    id: string,
    dto: ResolveExceptionDto,
    userId: string,
  ): Promise<ReconciliationException> {
    const ex = await this.requireById(id);
    this.assertOpen(ex);
    ex.status = 'RESOLVED_WITH_JUSTIFICATION';
    ex.resolutionNote = dto.resolutionNote;
    ex.resolvedBy = userId;
    ex.resolvedAt = new Date();
    const saved = await this.repo.save(ex);
    await this.matcher.recountUpload(ex.statementUploadId);
    return saved;
  }

  async confirm(
    id: string,
    dto: ConfirmExceptionDto,
    userId: string,
  ): Promise<ReconciliationException> {
    const ex = await this.requireById(id);
    this.assertOpen(ex);
    ex.status = 'CONFIRMED_EXCEPTION';
    ex.resolutionNote = dto.resolutionNote;
    ex.resolvedBy = userId;
    ex.resolvedAt = new Date();
    const saved = await this.repo.save(ex);
    await this.matcher.recountUpload(ex.statementUploadId);
    return saved;
  }

  // -------------------------------------------------------------------

  private assertOpen(ex: ReconciliationException): void {
    if (
      ex.status === 'RESOLVED_WITH_JUSTIFICATION' ||
      ex.status === 'CONFIRMED_EXCEPTION'
    ) {
      throw new BadRequestException(
        `Exception ${ex.exceptionNumber} is already closed (${ex.status}).`,
      );
    }
  }

  private async requireById(id: string): Promise<ReconciliationException> {
    const ex = await this.repo.findOne({
      where: { id },
      relations: {
        statementLine: {
          matchedPaymentRequest: true,
          matchedIncomingReceipt: true,
        },
        statementUpload: true,
        bankAccount: { bank: true, currency: true },
      },
    });
    if (!ex) throw new NotFoundException(`Reconciliation exception ${id} not found.`);
    return ex;
  }
}
