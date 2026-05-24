import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatementUpload } from './statement-upload.entity';
import { CreateStatementUploadDto } from './dto/create-statement-upload.dto';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface UploadQuery extends PaginationQueryDto {
  bankAccountId?: string;
}

@Injectable()
export class StatementUploadsService {
  private readonly logger = new Logger(StatementUploadsService.name);

  constructor(
    @InjectRepository(StatementUpload)
    private readonly repo: Repository<StatementUpload>,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  async create(dto: CreateStatementUploadDto, userId: string): Promise<StatementUpload> {
    // Enforce uniqueness: one statement per account per date.
    const existing = await this.repo.findOne({
      where: { bankAccountId: dto.bankAccountId, statementDate: dto.statementDate },
    });
    if (existing) {
      throw new ConflictException(
        `A statement upload for account ${dto.bankAccountId} on ${dto.statementDate} already exists.`,
      );
    }

    const upload = this.repo.create({
      bankAccountId: dto.bankAccountId,
      statementDate: dto.statementDate,
      openingBalance: String(dto.openingBalance),
      closingBalance: String(dto.closingBalance),
      fileUrl: dto.fileUrl,
      rowCount: dto.rowCount ?? 0,
      notes: dto.notes ?? null,
      uploadedBy: userId,
    });

    const saved = await this.repo.save(upload);

    // §2.5 — Reset the account balance to the statement's closing balance.
    try {
      await this.bankAccountsService.resetFromStatement({
        accountId: dto.bankAccountId,
        closingBalance: String(dto.closingBalance),
        statementUploadId: saved.id,
        asOfDate: new Date(dto.statementDate),
        userId,
      });
    } catch (err) {
      this.logger.warn(`Balance reset for account ${dto.bankAccountId} failed: ${(err as Error).message}`);
    }

    // §2.5/§2.6 — Lock all PAID payment requests whose source account is this
    // bank account and were paid on or before the statement date.
    // Once matched, post-execution amount correction is blocked.
    try {
      await this.repo.query(
        `UPDATE payment_requests
            SET is_amount_locked = TRUE
          WHERE source_account_id = $1
            AND status = 'PAID'
            AND paid_at::date <= $2::date
            AND is_amount_locked = FALSE
            AND deleted_at IS NULL`,
        [dto.bankAccountId, dto.statementDate],
      );
    } catch (err) {
      this.logger.warn(`Amount locking for account ${dto.bankAccountId} failed: ${(err as Error).message}`);
    }

    return this.requireById(saved.id);
  }

  async findAll(query: UploadQuery): Promise<PaginatedResult<StatementUpload>> {
    const { page = 1, limit = 20, bankAccountId } = query;

    const qb = this.repo
      .createQueryBuilder('su')
      .leftJoinAndSelect('su.bankAccount', 'ba')
      .leftJoinAndSelect('ba.bank', 'bank')
      .leftJoinAndSelect('ba.currency', 'currency')
      .leftJoinAndSelect('su.uploader', 'uploader')
      .orderBy('su.statementDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (bankAccountId) {
      qb.andWhere('su.bankAccountId = :bankAccountId', { bankAccountId });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<StatementUpload> {
    return this.requireById(id);
  }

  async remove(id: string): Promise<void> {
    const upload = await this.requireById(id);
    await this.repo.remove(upload);
  }

  private async requireById(id: string): Promise<StatementUpload> {
    const upload = await this.repo.findOne({
      where: { id },
      relations: {
        bankAccount: { bank: true, currency: true },
        uploader: true,
      },
    });
    if (!upload) throw new NotFoundException(`Statement upload ${id} not found`);
    return upload;
  }
}
