import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { StatementUpload } from './statement-upload.entity';
import {
  CreateStatementUploadDto,
  StatementUploadQueryDto,
} from './dto/reconciliation.dto';
import { BankAccount } from '../bank-accounts/bank-account.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class StatementUploadsService {
  constructor(
    @InjectRepository(StatementUpload)
    private readonly repo: Repository<StatementUpload>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * §8.1 / §2.5 — on upload, the account's recorded balance is reset to the
   * statement's closing balance and the reset is logged as a reconciliation
   * adjustment in the balance-change trail.
   */
  async create(dto: CreateStatementUploadDto, actorId: string): Promise<StatementUpload> {
    return this.dataSource.transaction(async (em) => {
      const account = await em.findOne(BankAccount, { where: { id: dto.bankAccountId } });
      if (!account) throw new NotFoundException('Bank account not found.');

      const upload = em.create(StatementUpload, {
        bankAccountId: dto.bankAccountId,
        statementDate: dto.statementDate,
        openingBalance: String(dto.openingBalance),
        closingBalance: String(dto.closingBalance),
        fileUrl: dto.fileUrl,
        notes: dto.notes ?? null,
        ingestionStatus: 'UPLOADED',
        ingestionFormat: detectFormat(dto.fileUrl),
        rowCount: 0,
        uploadedBy: actorId,
      });
      const saved = await em.save(upload);

      const previous = Number(account.remainingBalance);
      const next = Number(dto.closingBalance);
      if (previous !== next) {
        account.remainingBalance = next;
        account.updatedBy = actorId;
        await em.save(account);
        await em.query(
          `INSERT INTO balance_changes
            (account_id, kind, previous_balance, new_balance, delta, reason, statement_upload_id, changed_by)
           VALUES ($1, 'STATEMENT_RESET', $2, $3, $4, $5, $6, $7)`,
          [
            account.id,
            previous,
            next,
            next - previous,
            `Statement ${dto.statementDate} closing-balance reconciliation`,
            saved.id,
            actorId,
          ],
        );
      }

      return this.loadOne(saved.id, em);
    });
  }

  async findAll(query: StatementUploadQueryDto): Promise<PaginatedResult<StatementUpload>> {
    const { page = 1, limit = 20, bankAccountId } = query;
    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.bankAccount', 'bankAccount')
      .leftJoinAndSelect('bankAccount.bank', 'bank')
      .leftJoinAndSelect('bankAccount.currency', 'currency')
      .leftJoinAndSelect('u.uploader', 'uploader')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (bankAccountId) {
      qb.andWhere('u.bankAccountId = :bankAccountId', { bankAccountId });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findOne(id: string): Promise<StatementUpload> {
    return this.loadOne(id, this.dataSource.manager);
  }

  async remove(id: string): Promise<void> {
    const upload = await this.loadOne(id, this.dataSource.manager);
    await this.repo.softRemove(upload);
  }

  private async loadOne(id: string, em: EntityManager): Promise<StatementUpload> {
    const upload = await em.findOne(StatementUpload, {
      where: { id },
      relations: ['bankAccount', 'bankAccount.bank', 'bankAccount.currency', 'uploader'],
    });
    if (!upload) throw new NotFoundException(`Statement upload ${id} not found`);
    return upload;
  }
}

function detectFormat(fileUrl: string): 'CSV' | 'PDF' | null {
  const lower = fileUrl.toLowerCase();
  if (lower.endsWith('.csv')) return 'CSV';
  if (lower.endsWith('.pdf')) return 'PDF';
  return null;
}
