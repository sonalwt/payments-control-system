import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import {
  ApprovalMatrix,
  ApprovalMatrixStatus,
} from './approval-matrix.entity';

@Injectable()
export class ApprovalMatrixRepository {
  constructor(
    @InjectRepository(ApprovalMatrix)
    private readonly repo: Repository<ApprovalMatrix>,
  ) {}

  get raw(): Repository<ApprovalMatrix> {
    return this.repo;
  }

  create(data: Partial<ApprovalMatrix>): ApprovalMatrix {
    return this.repo.create(data);
  }

  save(entity: ApprovalMatrix): Promise<ApprovalMatrix> {
    return this.repo.save(entity);
  }

  findOneById(id: string): Promise<ApprovalMatrix | null> {
    return this.repo.findOne({
      where: { id },
      relations: { bands: { steps: true } },
    });
  }

  /** Highest existing version for a payment-type code; 0 if none. */
  async maxVersion(paymentTypeCode: string): Promise<number> {
    const row = await this.repo
      .createQueryBuilder('m')
      .select('COALESCE(MAX(m.version), 0)', 'max')
      .where('m.payment_type_code = :code', { code: paymentTypeCode })
      .withDeleted()
      .getRawOne<{ max: string }>();
    return row ? Number(row.max) : 0;
  }

  /** The currently-published matrix for a payment-type as of a given date. */
  findPublishedAsOf(
    paymentTypeCode: string,
    asOfDate: string,
  ): Promise<ApprovalMatrix | null> {
    return this.repo.findOne({
      where: [
        {
          paymentTypeCode,
          status: ApprovalMatrixStatus.PUBLISHED,
          effectiveFrom: LessThanOrEqual(asOfDate),
          effectiveTo: IsNull(),
        },
        {
          paymentTypeCode,
          status: ApprovalMatrixStatus.PUBLISHED,
          effectiveFrom: LessThanOrEqual(asOfDate),
          effectiveTo: MoreThanOrEqual(asOfDate),
        },
      ],
      relations: { bands: { steps: true } },
    });
  }

  async softRemove(entity: ApprovalMatrix): Promise<ApprovalMatrix> {
    return this.repo.softRemove(entity);
  }
}
