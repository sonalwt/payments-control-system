import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ApprovalMatrix } from './approval-matrix.entity';
import { ApprovalMatrixBand } from './approval-matrix-band.entity';
import { ApprovalMatrixStep } from './approval-matrix-step.entity';
import { CreateApprovalMatrixDto } from './dto/create-approval-matrix.dto';
import { UpdateApprovalMatrixDto } from './dto/update-approval-matrix.dto';
import {
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { MatricesQueryDto } from './dto/matrices-query.dto';

@Injectable()
export class ApprovalMatricesService {
  constructor(
    @InjectRepository(ApprovalMatrix)
    private readonly repo: Repository<ApprovalMatrix>,
    @InjectRepository(ApprovalMatrixBand)
    private readonly bandRepo: Repository<ApprovalMatrixBand>,
    private readonly dataSource: DataSource,
  ) {}

  /** Validate band shape: at most one open-ended band (no maxAmount), and
   *  every step references exactly one of approverUserId/approverRoleId. */
  private validateBands(bands: CreateApprovalMatrixDto['bands']): void {
    const openEnded = bands.filter((b) => b.maxAmount == null);
    if (openEnded.length > 1) {
      throw new BadRequestException('At most one open-ended band is allowed');
    }
    for (const b of bands) {
      if (b.maxAmount != null && b.maxAmount <= b.minAmount) {
        throw new BadRequestException(
          `Band maxAmount (${b.maxAmount}) must be greater than minAmount (${b.minAmount})`,
        );
      }
      for (const s of b.steps) {
        if (s.approverType === 'USER' && !s.approverUserId) {
          throw new BadRequestException('USER step requires approverUserId');
        }
        if (s.approverType === 'ROLE' && !s.approverRoleId) {
          throw new BadRequestException('ROLE step requires approverRoleId');
        }
        if (s.approverType === 'USER' && s.approverRoleId) {
          throw new BadRequestException('USER step must not have approverRoleId');
        }
        if (s.approverType === 'ROLE' && s.approverUserId) {
          throw new BadRequestException('ROLE step must not have approverUserId');
        }
      }
    }
  }

  async create(dto: CreateApprovalMatrixDto, actorId: string): Promise<ApprovalMatrix> {
    this.validateBands(dto.bands);
    const dup = await this.repo.findOne({
      where: {
        paymentTypeId: dto.paymentTypeId,
        currencyId: dto.currencyId,
        name: dto.name,
      },
    });
    if (dup) {
      throw new ConflictException(
        `Matrix "${dto.name}" already exists for this payment type / currency`,
      );
    }

    return this.dataSource.transaction(async (em) => {
      const matrix = em.create(ApprovalMatrix, {
        name: dto.name,
        description: dto.description ?? null,
        paymentTypeId: dto.paymentTypeId,
        currencyId: dto.currencyId,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo ?? null,
        isActive: dto.isActive ?? true,
        ttMode: dto.ttMode,
        createdBy: actorId,
        updatedBy: actorId,
      });
      const saved = await em.save(matrix);

      // sort bands by min amount for deterministic ordering
      const sortedBands = [...dto.bands].sort((a, b) => a.minAmount - b.minAmount);
      for (let i = 0; i < sortedBands.length; i++) {
        const band = sortedBands[i];
        const bandEntity = em.create(ApprovalMatrixBand, {
          matrixId: saved.id,
          sortOrder: i,
          minAmount: band.minAmount,
          maxAmount: band.maxAmount ?? null,
        });
        const savedBand = await em.save(bandEntity);
        for (let j = 0; j < band.steps.length; j++) {
          const step = band.steps[j];
          const stepEntity = em.create(ApprovalMatrixStep, {
            bandId: savedBand.id,
            stepOrder: j,
            approverType: step.approverType,
            approverUserId: step.approverUserId ?? null,
            approverRoleId: step.approverRoleId ?? null,
            isOptional: step.isOptional ?? false,
          });
          await em.save(stepEntity);
        }
      }

      return this.loadOne(saved.id, em.getRepository(ApprovalMatrix));
    });
  }

  async findAll(
    query: MatricesQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedResult<ApprovalMatrix>> {
    const { page = 1, limit = 20, search, mine } = query;

    // Apply WHERE clauses (search + mine) consistently to both the
    // paginated-IDs query and the count query.
    const applyFilters = (qb: SelectQueryBuilder<ApprovalMatrix>): void => {
      if (search) qb.andWhere('m.name ILIKE :s', { s: `%${search}%` });
      if (mine === 'true' && currentUserId) {
        qb.andWhere(
          `m.id IN (
            SELECT b.matrix_id
              FROM approval_matrix_bands b
              INNER JOIN approval_matrix_steps s ON s.band_id = b.id
              WHERE s.approver_user_id = :uid
                 OR s.approver_role_id IN (
                      SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = :uid
                    )
            UNION
            SELECT m2.id
              FROM approval_matrices m2
              INNER JOIN payment_types pt ON pt.id = m2.payment_type_id
              WHERE EXISTS (
                      SELECT 1 FROM user_roles ur
                      WHERE ur.user_id = :uid
                        AND (ur.role_id = ANY(pt.maker_role_ids) OR ur.role_id = pt.maker_role_id)
                    )
                 OR pt.checker_role_id IN (
                      SELECT ur.role_id FROM user_roles ur WHERE ur.user_id = :uid
                    )
          )`,
          { uid: currentUserId },
        );
      }
    };

    // Page over parent IDs only — no joined collections, so LIMIT counts
    // matrices, not the multiplied band*step rows.
    const idsQb = this.repo
      .createQueryBuilder('m')
      .select('m.id', 'id')
      .orderBy('m.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    applyFilters(idsQb);
    const idRows = await idsQb.getRawMany<{ id: string }>();
    const ids = idRows.map((r) => r.id);

    const countQb = this.repo.createQueryBuilder('m');
    applyFilters(countQb);
    const total = await countQb.getCount();

    if (ids.length === 0) {
      return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const data = await this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.paymentType', 'paymentType')
      .leftJoinAndSelect('paymentType.makerRole', 'paymentTypeMakerRole')
      .leftJoinAndSelect('paymentType.checkerRole', 'paymentTypeCheckerRole')
      .leftJoinAndSelect('m.currency', 'currency')
      .leftJoinAndSelect('m.bands', 'band')
      .leftJoinAndSelect('band.steps', 'step')
      .leftJoinAndSelect('step.approverUser', 'approverUser')
      .leftJoinAndSelect('step.approverRole', 'approverRole')
      .where('m.id IN (:...ids)', { ids })
      .orderBy('m.name', 'ASC')
      .addOrderBy('band.sortOrder', 'ASC')
      .addOrderBy('step.stepOrder', 'ASC')
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async loadOne(id: string, repo: Repository<ApprovalMatrix>): Promise<ApprovalMatrix> {
    const m = await repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.paymentType', 'paymentType')
      .leftJoinAndSelect('paymentType.makerRole', 'paymentTypeMakerRole')
      .leftJoinAndSelect('paymentType.checkerRole', 'paymentTypeCheckerRole')
      .leftJoinAndSelect('m.currency', 'currency')
      .leftJoinAndSelect('m.bands', 'band')
      .leftJoinAndSelect('band.steps', 'step')
      .leftJoinAndSelect('step.approverUser', 'approverUser')
      .leftJoinAndSelect('step.approverRole', 'approverRole')
      .where('m.id = :id', { id })
      .orderBy('band.sortOrder', 'ASC')
      .addOrderBy('step.stepOrder', 'ASC')
      .getOne();
    if (!m) throw new NotFoundException(`Approval matrix ${id} not found`);
    return m;
  }

  findOne(id: string): Promise<ApprovalMatrix> {
    return this.loadOne(id, this.repo);
  }

  async update(id: string, dto: UpdateApprovalMatrixDto, actorId: string): Promise<ApprovalMatrix> {
    await this.findOne(id);
    if (dto.bands) this.validateBands(dto.bands);

    return this.dataSource.transaction(async (em) => {
      const matrix = await em.findOne(ApprovalMatrix, { where: { id } });
      if (!matrix) throw new NotFoundException(`Approval matrix ${id} not found`);

      Object.assign(matrix, {
        name: dto.name ?? matrix.name,
        description: dto.description ?? matrix.description,
        paymentTypeId: dto.paymentTypeId ?? matrix.paymentTypeId,
        currencyId: dto.currencyId ?? matrix.currencyId,
        effectiveFrom: dto.effectiveFrom ?? matrix.effectiveFrom,
        effectiveTo: dto.effectiveTo ?? matrix.effectiveTo,
        isActive: dto.isActive ?? matrix.isActive,
        ttMode: dto.ttMode ?? matrix.ttMode,
        updatedBy: actorId,
      });
      await em.save(matrix);

      if (dto.bands) {
        // wholesale replace bands + steps (cascade delete + recreate)
        await em.delete(ApprovalMatrixBand, { matrixId: id });
        const sortedBands = [...dto.bands].sort((a, b) => a.minAmount - b.minAmount);
        for (let i = 0; i < sortedBands.length; i++) {
          const band = sortedBands[i];
          const bandEntity = em.create(ApprovalMatrixBand, {
            matrixId: id,
            sortOrder: i,
            minAmount: band.minAmount,
            maxAmount: band.maxAmount ?? null,
          });
          const savedBand = await em.save(bandEntity);
          for (let j = 0; j < band.steps.length; j++) {
            const step = band.steps[j];
            const stepEntity = em.create(ApprovalMatrixStep, {
              bandId: savedBand.id,
              stepOrder: j,
              approverType: step.approverType,
              approverUserId: step.approverUserId ?? null,
              approverRoleId: step.approverRoleId ?? null,
              isOptional: step.isOptional ?? false,
            });
            await em.save(stepEntity);
          }
        }
      }

      return this.loadOne(id, em.getRepository(ApprovalMatrix));
    });
  }

  async remove(id: string, actorId: string): Promise<void> {
    const matrix = await this.findOne(id);
    matrix.updatedBy = actorId;
    await this.repo.save(matrix);
    await this.repo.softRemove(matrix);
  }
}
