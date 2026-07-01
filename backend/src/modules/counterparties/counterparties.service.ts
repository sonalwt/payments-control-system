import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Counterparty,
  CounterpartyKycStatus,
} from './counterparty.entity';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';
import { CounterpartyQueryDto } from './dto/counterparty-query.dto';
import { KycListQueryDto, KycRejectDto } from './dto/kyc-action.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { RoleCode } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CounterpartiesService {
  constructor(
    @InjectRepository(Counterparty)
    private readonly repo: Repository<Counterparty>,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateCounterpartyDto, actor: AuthenticatedUser): Promise<Counterparty> {
    if (await this.repo.findOne({ where: { code: dto.code } })) {
      throw new ConflictException(`Counterparty "${dto.code}" already exists`);
    }

    // Admins (counterparty masters) create approved counterparties as before.
    // Non-admins self-serve: the payment nature drives the KYC routing.
    const isAdmin =
      actor.roles.includes(RoleCode.SUPER_ADMIN) ||
      actor.roles.includes(RoleCode.COUNTERPARTY);

    let kycStatus: CounterpartyKycStatus = 'APPROVED';
    let kycFlagged = false;
    let route: 'KYC_APPROVAL' | 'KYC_FLAGGED' | null = null;

    if (!isAdmin) {
      if (!dto.paymentNature) {
        throw new BadRequestException(
          'Payment nature (Trade / Non-Trade) is required to create a counterparty.',
        );
      }
      if (dto.paymentNature === 'TRADE') {
        // Trade → routed to the KYC team; not usable until approved.
        kycStatus = 'PENDING';
        route = 'KYC_APPROVAL';
      } else {
        // Non-trade → added directly (usable now) but flagged to the KYC team.
        kycStatus = 'APPROVED';
        kycFlagged = true;
        route = 'KYC_FLAGGED';
      }
    }

    const cp = this.repo.create({
      code: dto.code,
      name: dto.name,
      legalName: dto.legalName ?? null,
      role: dto.role,
      paymentNature: dto.paymentNature ?? null,
      countryId: dto.countryId ?? null,
      taxIdentifiers: dto.taxIdentifiers ?? [],
      addresses: dto.addresses ?? [],
      primaryContactName: dto.primaryContactName ?? null,
      primaryContactEmail: dto.primaryContactEmail ?? null,
      primaryContactPhone: dto.primaryContactPhone ?? null,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true,
      kycStatus,
      kycFlagged,
      // kyc_done is the legacy "KYC verified" flag; only an admin create or a
      // KYC approval sets it true. A non-trade direct add is usable but not yet
      // KYC-verified.
      kycDone: isAdmin ? (dto.kycDone ?? false) : false,
      createdBy: actor.id,
      updatedBy: actor.id,
    });
    const saved = await this.repo.save(cp);

    // Best-effort: tell the KYC team. A mail failure must not fail creation.
    if (route) {
      await this.notifyKycTeamOfNewCounterparty(saved, actor.id, route);
    }
    return saved;
  }

  async findAll(query: CounterpartyQueryDto): Promise<PaginatedResult<Counterparty>> {
    const { page = 1, limit = 20, search, role } = query;
    const qb = this.repo
      .createQueryBuilder('cp')
      .leftJoinAndSelect('cp.country', 'country')
      .orderBy('cp.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere(
        '(cp.name ILIKE :s OR cp.code ILIKE :s OR cp.legalName ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (role) {
      qb.andWhere('cp.role = :role', { role });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Counterparty> {
    const cp = await this.repo.findOne({ where: { id }, relations: ['country'] });
    if (!cp) throw new NotFoundException(`Counterparty ${id} not found`);
    return cp;
  }

  async update(id: string, dto: UpdateCounterpartyDto, actorId: string): Promise<Counterparty> {
    const cp = await this.findOne(id);
    if (dto.code && dto.code !== cp.code) {
      const dup = await this.repo.findOne({ where: { code: dto.code } });
      if (dup && dup.id !== id) {
        throw new ConflictException(`Counterparty "${dto.code}" already exists`);
      }
    }
    Object.assign(cp, dto, { updatedBy: actorId });
    return this.repo.save(cp);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const cp = await this.findOne(id);
    cp.updatedBy = actorId;
    await this.repo.save(cp);
    await this.repo.softRemove(cp);
  }

  // ===================================================================
  // KYC review (KYC team)
  // ===================================================================

  /**
   * The KYC review queue: trade counterparties awaiting approval (PENDING) and
   * non-trade direct adds flagged for review. `filter` narrows to one or the
   * other; the default returns both.
   */
  async listKyc(query: KycListQueryDto & { page?: number; limit?: number }): Promise<
    PaginatedResult<Counterparty>
  > {
    const { filter, page = 1, limit = 20 } = query;
    const qb = this.repo
      .createQueryBuilder('cp')
      .leftJoinAndSelect('cp.country', 'country')
      .orderBy('cp.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (filter === 'PENDING') {
      qb.where('cp.kyc_status = :s', { s: 'PENDING' });
    } else if (filter === 'FLAGGED') {
      qb.where('cp.kyc_flagged = true');
    } else {
      qb.where('(cp.kyc_status = :s OR cp.kyc_flagged = true)', { s: 'PENDING' });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** KYC team approves a counterparty — it becomes usable in payments. */
  async approveKyc(id: string, actorId: string): Promise<Counterparty> {
    const cp = await this.findOne(id);
    if (cp.kycStatus === 'APPROVED' && !cp.kycFlagged) {
      throw new BadRequestException('Counterparty is already approved.');
    }
    cp.kycStatus = 'APPROVED';
    cp.kycFlagged = false;
    cp.kycDone = true;
    cp.kycRejectionReason = null;
    cp.kycReviewedBy = actorId;
    cp.kycReviewedAt = new Date();
    cp.updatedBy = actorId;
    const saved = await this.repo.save(cp);
    await this.notifyCreatorOfKycDecision(saved, actorId, 'APPROVED');
    return saved;
  }

  /** KYC team rejects a counterparty — it cannot be used in payments. */
  async rejectKyc(id: string, dto: KycRejectDto, actorId: string): Promise<Counterparty> {
    const cp = await this.findOne(id);
    if (cp.kycStatus === 'REJECTED') {
      throw new BadRequestException('Counterparty is already rejected.');
    }
    cp.kycStatus = 'REJECTED';
    cp.kycFlagged = false;
    cp.kycDone = false;
    cp.kycRejectionReason = dto.reason;
    cp.kycReviewedBy = actorId;
    cp.kycReviewedAt = new Date();
    cp.updatedBy = actorId;
    const saved = await this.repo.save(cp);
    await this.notifyCreatorOfKycDecision(saved, actorId, 'REJECTED', dto.reason);
    return saved;
  }

  // ===================================================================
  // Notifications (best-effort)
  // ===================================================================

  private async findRoleHolders(
    code: RoleCode,
  ): Promise<{ id: string; email: string; fullName: string }[]> {
    const users = await this.repo.manager
      .getRepository(User)
      .createQueryBuilder('u')
      .innerJoin('u.userRoles', 'ur')
      .innerJoin('ur.role', 'r')
      .where('r.code = :code', { code })
      .andWhere('u.is_active = true')
      .select(['u.id', 'u.email', 'u.fullName'])
      .getMany();
    return users
      .filter((u) => !!u.email)
      .map((u) => ({ id: u.id, email: u.email, fullName: u.fullName }));
  }

  /** Email the KYC team when a self-service counterparty is created. */
  private async notifyKycTeamOfNewCounterparty(
    cp: Counterparty,
    creatorId: string,
    route: 'KYC_APPROVAL' | 'KYC_FLAGGED',
  ): Promise<void> {
    const [team, creator] = await Promise.all([
      this.findRoleHolders(RoleCode.KYC_TEAM),
      this.repo.manager.findOne(User, { where: { id: creatorId }, select: ['id', 'fullName'] }),
    ]);
    if (team.length === 0) return;
    const creatorName = creator?.fullName ?? 'A user';
    const approval = route === 'KYC_APPROVAL';
    const subject = approval
      ? `Counterparty ${cp.code} awaiting KYC approval`
      : `Counterparty ${cp.code} added — KYC review`;
    const action = approval
      ? `created a Trade counterparty that requires your approval before it can be used in a payment. ` +
        `It will remain unusable until you approve it.`
      : `added a Non-Trade counterparty directly. It is already usable, but it is flagged for your review.`;
    await Promise.all(
      team.map((m) => {
        const text =
          `Hello ${m.fullName},\n\n` +
          `${creatorName} ${action}\n\n` +
          `Counterparty: ${cp.name} (${cp.code})\n` +
          `Nature: ${cp.paymentNature ?? '—'}\n\n` +
          `Please review it in the Counterparty KYC queue.\n`;
        const html =
          `<p>Hello ${m.fullName},</p>` +
          `<p>${creatorName} ${action}</p>` +
          `<p><strong>Counterparty:</strong> ${cp.name} (${cp.code})<br/>` +
          `<strong>Nature:</strong> ${cp.paymentNature ?? '—'}</p>` +
          `<p>Please review it in the Counterparty KYC queue.</p>`;
        return this.mail.sendNotification(m.email, subject, text, html);
      }),
    );
  }

  /** Email the counterparty's creator with the KYC team's decision. */
  private async notifyCreatorOfKycDecision(
    cp: Counterparty,
    actorId: string,
    decision: 'APPROVED' | 'REJECTED',
    reason?: string,
  ): Promise<void> {
    if (!cp.createdBy) return;
    const [creator, actor] = await Promise.all([
      this.repo.manager.findOne(User, {
        where: { id: cp.createdBy },
        select: ['id', 'email', 'fullName'],
      }),
      this.repo.manager.findOne(User, { where: { id: actorId }, select: ['id', 'fullName'] }),
    ]);
    if (!creator?.email) return;
    const actorName = actor?.fullName ?? 'The KYC team';
    const approved = decision === 'APPROVED';
    const subject = `Counterparty ${cp.code} ${approved ? 'approved' : 'rejected'} by KYC`;
    const text =
      `Hello ${creator.fullName},\n\n` +
      `${actorName} has ${approved ? 'approved' : 'rejected'} counterparty ${cp.name} (${cp.code}).\n` +
      (approved
        ? `It can now be used in payment requests.\n`
        : `It cannot be used in payment requests.\n${reason ? `\nReason: ${reason}\n` : ''}`);
    const html =
      `<p>Hello ${creator.fullName},</p>` +
      `<p>${actorName} has <strong>${approved ? 'approved' : 'rejected'}</strong> counterparty ` +
      `${cp.name} (${cp.code}).</p>` +
      (approved
        ? `<p>It can now be used in payment requests.</p>`
        : `<p>It cannot be used in payment requests.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}`);
    await this.mail.sendNotification(creator.email, subject, text, html);
  }
}
