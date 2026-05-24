import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import {
  ApprovalMatrix,
  ApprovalMatrixStatus,
} from './approval-matrix.entity';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';
import {
  ApprovalMatrixStep,
  ApproverType,
} from './approval-matrix-step.entity';
import { ApprovalMatrixRepository } from './approval-matrix.repository';
import { CreateApprovalMatrixDto } from './dto/create-approval-matrix.dto';
import { UpdateApprovalMatrixDto } from './dto/update-approval-matrix.dto';
import { MatrixBandDto } from './dto/matrix-band.dto';
import { ResolveChainDto } from './dto/resolve-chain.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

interface MatrixQuery extends PaginationQueryDto {
  paymentTypeCode?: string;
  status?: ApprovalMatrixStatus;
}

export interface ResolvedChainStep {
  stepOrder: number;
  approverType: ApproverType;
  approverUserId: string | null;
  approverRoleId: string | null;
  isOptional: boolean;
}

export interface ResolvedChain {
  matrixId: string;
  matrixName: string;
  version: number;
  paymentTypeCode: string;
  currencyCode: string;
  amountMinor: number;
  bandId: string;
  bandMin: number;
  bandMax: number | null;
  steps: ResolvedChainStep[];
}

@Injectable()
export class ApprovalMatricesService {
  constructor(private readonly repo: ApprovalMatrixRepository) {}

  // ---------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------

  async create(
    dto: CreateApprovalMatrixDto,
    userId: string,
  ): Promise<ApprovalMatrix> {
    this.assertBandsValid(dto.bands);

    const nextVersion = (await this.repo.maxVersion(dto.paymentTypeCode)) + 1;

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      paymentTypeCode: dto.paymentTypeCode,
      version: nextVersion,
      status: ApprovalMatrixStatus.DRAFT,
      effectiveFrom: dto.effectiveFrom ?? new Date().toISOString().slice(0, 10),
      isActive: true,
      bands: this.buildBands(dto.bands),
      createdBy: userId,
      updatedBy: userId,
    });

    return this.repo.save(entity);
  }

  async findAll(query: MatrixQuery): Promise<PaginatedResult<ApprovalMatrix>> {
    const { page = 1, limit = 20, search, paymentTypeCode, status } = query;
    const where: Record<string, unknown> = {};
    if (paymentTypeCode) where.paymentTypeCode = paymentTypeCode;
    if (status) where.status = status;

    const baseWhere = search
      ? [
          { ...where, name: ILike(`%${search}%`) },
          { ...where, paymentTypeCode: ILike(`%${search}%`) },
        ]
      : Object.keys(where).length > 0
        ? where
        : undefined;

    const [data, total] = await this.repo.raw.findAndCount({
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
      order: { paymentTypeCode: 'ASC', version: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<ApprovalMatrix> {
    const m = await this.repo.findOneById(id);
    if (!m) throw new NotFoundException(`Approval matrix ${id} not found`);
    return m;
  }

  async update(
    id: string,
    dto: UpdateApprovalMatrixDto,
    userId: string,
  ): Promise<ApprovalMatrix> {
    const matrix = await this.findOne(id);
    if (matrix.status !== ApprovalMatrixStatus.DRAFT) {
      throw new BadRequestException(
        `Only DRAFT matrices can be edited. Create a new version to change a ${matrix.status} matrix.`,
      );
    }

    if (dto.bands) {
      this.assertBandsValid(dto.bands);
      matrix.bands = this.buildBands(dto.bands);
    }
    if (dto.name !== undefined) matrix.name = dto.name;
    if (dto.description !== undefined) matrix.description = dto.description ?? null;
    if (dto.effectiveFrom !== undefined && dto.effectiveFrom) {
      matrix.effectiveFrom = dto.effectiveFrom;
    }
    matrix.updatedBy = userId;

    return this.repo.save(matrix);
  }

  async remove(id: string, userId: string): Promise<void> {
    const matrix = await this.findOne(id);
    if (matrix.status === ApprovalMatrixStatus.PUBLISHED) {
      throw new BadRequestException(
        'Published matrices cannot be deleted; supersede them with a new version.',
      );
    }
    matrix.updatedBy = userId;
    await this.repo.raw.save(matrix);
    await this.repo.softRemove(matrix);
  }

  // ---------------------------------------------------------------------
  // Publish — DRAFT → PUBLISHED, closes out the previous PUBLISHED version
  // ---------------------------------------------------------------------

  async publish(id: string, userId: string): Promise<ApprovalMatrix> {
    const matrix = await this.findOne(id);
    if (matrix.status !== ApprovalMatrixStatus.DRAFT) {
      throw new BadRequestException(
        `Only DRAFT matrices can be published (current: ${matrix.status}).`,
      );
    }
    if (!matrix.bands || matrix.bands.length === 0) {
      throw new BadRequestException('Cannot publish a matrix with no bands.');
    }

    const effectiveFrom = matrix.effectiveFrom;
    const previous = await this.repo.findPublishedAsOf(
      matrix.paymentTypeCode,
      effectiveFrom,
    );

    if (previous && previous.id !== matrix.id) {
      if (previous.effectiveFrom >= effectiveFrom) {
        throw new BadRequestException(
          `Effective-from must be after the previous published matrix (${previous.effectiveFrom}).`,
        );
      }
      previous.status = ApprovalMatrixStatus.SUPERSEDED;
      previous.effectiveTo = this.dayBefore(effectiveFrom);
      previous.updatedBy = userId;
      await this.repo.save(previous);
    }

    matrix.status = ApprovalMatrixStatus.PUBLISHED;
    matrix.publishedAt = new Date();
    matrix.publishedBy = userId;
    matrix.updatedBy = userId;
    return this.repo.save(matrix);
  }

  // ---------------------------------------------------------------------
  // Resolve — return the sequential chain for a (payment type, currency,
  // amount, as-of) tuple. Pin asOfDate to the request submission date so
  // in-flight requests retain their original chain (§1.5).
  // ---------------------------------------------------------------------

  async resolveChain(dto: ResolveChainDto): Promise<ResolvedChain> {
    const asOf = dto.asOfDate ?? new Date().toISOString().slice(0, 10);
    const matrix = await this.repo.findPublishedAsOf(dto.paymentTypeCode, asOf);
    if (!matrix) {
      throw new NotFoundException(
        `No published approval matrix for "${dto.paymentTypeCode}" effective on ${asOf}.`,
      );
    }

    const band = matrix.bands.find(
      (b) =>
        b.currencyCode === dto.currencyCode &&
        dto.amountMinor >= b.minAmountMinor &&
        (b.maxAmountMinor === null || b.maxAmountMinor === undefined
          ? true
          : dto.amountMinor <= b.maxAmountMinor),
    );
    if (!band) {
      throw new NotFoundException(
        `No band in matrix "${matrix.name}" covers ${dto.amountMinor} ${dto.currencyCode}.`,
      );
    }

    const orderedSteps = [...(band.steps ?? [])].sort(
      (a, b) => a.stepOrder - b.stepOrder,
    );

    return {
      matrixId: matrix.id,
      matrixName: matrix.name,
      version: matrix.version,
      paymentTypeCode: matrix.paymentTypeCode,
      currencyCode: band.currencyCode,
      amountMinor: dto.amountMinor,
      bandId: band.id,
      bandMin: band.minAmountMinor,
      bandMax: band.maxAmountMinor ?? null,
      steps: orderedSteps.map((s) => ({
        stepOrder: s.stepOrder,
        approverType: s.approverType,
        approverUserId: s.approverUserId ?? null,
        approverRoleId: s.approverRoleId ?? null,
        isOptional: s.isOptional,
      })),
    };
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private buildBands(bandsDto: MatrixBandDto[]): ApprovalMatrixBand[] {
    return bandsDto.map((b, i) => {
      const band = new ApprovalMatrixBand();
      band.currencyCode = b.currencyCode;
      band.minAmountMinor = b.minAmountMinor;
      band.maxAmountMinor = b.maxAmountMinor ?? null;
      band.sortOrder = b.sortOrder ?? i;
      band.steps = [...b.steps]
        .sort((a, c) => a.stepOrder - c.stepOrder)
        .map((s, idx) => {
          const step = new ApprovalMatrixStep();
          step.stepOrder = idx + 1; // canonicalise to 1..N contiguous
          step.approverType = s.approverType;
          step.approverUserId =
            s.approverType === ApproverType.USER ? (s.approverUserId ?? null) : null;
          step.approverRoleId =
            s.approverType === ApproverType.ROLE ? (s.approverRoleId ?? null) : null;
          step.isOptional = s.isOptional ?? false;
          return step;
        });
      return band;
    });
  }

  /**
   * Bands must:
   *  - have ≥ 1 entry,
   *  - not overlap within (matrix, currency),
   *  - have at most one open-ended (null max) band per currency, and it must
   *    be the highest-min band for that currency,
   *  - each carry ≥ 1 approver step.
   */
  private assertBandsValid(bands: MatrixBandDto[]): void {
    if (!bands || bands.length === 0) {
      throw new BadRequestException('At least one band is required.');
    }

    const byCcy = new Map<string, MatrixBandDto[]>();
    for (const b of bands) {
      if (
        b.maxAmountMinor !== null &&
        b.maxAmountMinor !== undefined &&
        b.maxAmountMinor < b.minAmountMinor
      ) {
        throw new BadRequestException(
          `Band ${b.currencyCode} ${b.minAmountMinor}-${b.maxAmountMinor}: max must be ≥ min.`,
        );
      }
      if (!b.steps || b.steps.length === 0) {
        throw new BadRequestException(
          `Band ${b.currencyCode} ${b.minAmountMinor}-${b.maxAmountMinor ?? '∞'} has no approver steps.`,
        );
      }
      if (!byCcy.has(b.currencyCode)) byCcy.set(b.currencyCode, []);
      byCcy.get(b.currencyCode)!.push(b);
    }

    for (const [ccy, list] of byCcy) {
      const sorted = [...list].sort(
        (a, b) => a.minAmountMinor - b.minAmountMinor,
      );
      for (let i = 0; i < sorted.length; i++) {
        const cur = sorted[i];
        const prev = sorted[i - 1];
        if (prev) {
          const prevMax =
            prev.maxAmountMinor === null || prev.maxAmountMinor === undefined
              ? Number.POSITIVE_INFINITY
              : prev.maxAmountMinor;
          if (cur.minAmountMinor <= prevMax) {
            throw new BadRequestException(
              `Overlapping bands in ${ccy}: ${prev.minAmountMinor}-${prev.maxAmountMinor ?? '∞'} and ${cur.minAmountMinor}-${cur.maxAmountMinor ?? '∞'}.`,
            );
          }
        }
        const isOpenEnded =
          cur.maxAmountMinor === null || cur.maxAmountMinor === undefined;
        if (isOpenEnded && i !== sorted.length - 1) {
          throw new BadRequestException(
            `Open-ended band in ${ccy} must be the highest band.`,
          );
        }
      }
    }
  }

  private dayBefore(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }
}
