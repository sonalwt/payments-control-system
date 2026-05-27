import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto, actorId: string): Promise<User> {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.repo.create({
      email: dto.email,
      fullName: dto.fullName,
      employeeCode: dto.employeeCode ?? null,
      isActive: dto.isActive ?? true,
      passwordHash,
      createdBy: actorId,
      updatedBy: actorId,
    });
    const saved = await this.repo.save(user);
    delete (saved as Partial<User>).passwordHash;
    return saved;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 20, search } = query;
    const qb = this.repo
      .createQueryBuilder('u')
      .orderBy('u.fullName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('(u.fullName ILIKE :s OR u.email ILIKE :s)', { s: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();

    // Batch-load role names and legal entity names for all users on this page.
    const roleMap = new Map<string, string[]>();
    const entityMap = new Map<string, string[]>();
    if (data.length > 0) {
      const ids = data.map((u) => u.id);
      const rows = await this.repo
        .createQueryBuilder('u')
        .leftJoin('u.entityRoles', 'uer', 'uer.is_active = true')
        .leftJoin('uer.role', 'r')
        .leftJoin('uer.legalEntity', 'le')
        .where('u.id IN (:...ids)', { ids })
        .select(['u.id AS uid', 'r.name AS role_name', 'le.name AS entity_name'])
        .getRawMany<{ uid: string; role_name: string | null; entity_name: string | null }>();
      for (const row of rows) {
        if (row.role_name) {
          if (!roleMap.has(row.uid)) roleMap.set(row.uid, []);
          if (!roleMap.get(row.uid)!.includes(row.role_name))
            roleMap.get(row.uid)!.push(row.role_name);
        }
        if (row.entity_name) {
          if (!entityMap.has(row.uid)) entityMap.set(row.uid, []);
          if (!entityMap.get(row.uid)!.includes(row.entity_name))
            entityMap.get(row.uid)!.push(row.entity_name);
        }
      }
    }

    return {
      data: data.map((u) => Object.assign(u, {
        roles: roleMap.get(u.id) ?? [],
        legalEntities: entityMap.get(u.id) ?? [],
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const u = await this.repo.findOne({
      where: { id },
      relations: ['entityRoles', 'entityRoles.role', 'entityRoles.legalEntity'],
    });
    if (!u) throw new NotFoundException(`User ${id} not found`);
    return u;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<User> {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      const dup = await this.repo.findOne({ where: { email: dto.email } });
      if (dup && dup.id !== id) {
        throw new ConflictException(`User with email "${dto.email}" already exists`);
      }
    }
    Object.assign(user, dto, { updatedBy: actorId });
    return this.repo.save(user);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const user = await this.findOne(id);
    user.updatedBy = actorId;
    await this.repo.save(user);
    await this.repo.softRemove(user);
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.repo.update({ id }, { lastLoginAt: new Date() });
  }

  async loadRoleCodes(userId: string): Promise<{ roles: string[]; entityIds: string[] }> {
    const rows = await this.repo
      .createQueryBuilder('u')
      .leftJoin('u.entityRoles', 'uer', 'uer.is_active = true')
      .leftJoin('uer.role', 'r')
      .where('u.id = :userId', { userId })
      .select([
        'u.id AS uid',
        'u.is_platform_admin AS is_platform_admin',
        'r.code AS role_code',
        'uer.legal_entity_id AS le_id',
      ])
      .getRawMany<{
        uid: string;
        is_platform_admin: boolean;
        role_code: string | null;
        le_id: string | null;
      }>();
    const roles = new Set<string>();
    const entityIds = new Set<string>();
    for (const r of rows) {
      if (r.role_code) roles.add(r.role_code);
      if (r.le_id) entityIds.add(r.le_id);
    }
    // Platform admins implicitly hold SUPER_ADMIN across every entity.
    if (rows[0]?.is_platform_admin) {
      roles.add('SUPER_ADMIN');
    }
    return { roles: [...roles], entityIds: [...entityIds] };
  }
}
