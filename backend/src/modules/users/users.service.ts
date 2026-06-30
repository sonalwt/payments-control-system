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
import { UsersQueryDto } from './dto/users-query.dto';
import {
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { ImportResult, parseImportFile } from '../../common/helpers/parse-import-file';

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

  async findAll(query: UsersQueryDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 20, search, roleCode } = query;
    const qb = this.repo
      .createQueryBuilder('u')
      .orderBy('u.fullName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (search) {
      qb.andWhere('(u.fullName ILIKE :s OR u.email ILIKE :s)', { s: `%${search}%` });
    }
    if (roleCode) {
      qb.andWhere(
        `u.id IN (
          SELECT ur.user_id FROM user_roles ur
          INNER JOIN roles r ON r.id = ur.role_id
          WHERE r.code = :roleCode AND r.deleted_at IS NULL
        )`,
        { roleCode },
      );
    }
    const [data, total] = await qb.getManyAndCount();

    // Batch-load role names for users on this page.
    const roleMap = new Map<string, string[]>();
    if (data.length > 0) {
      const ids = data.map((u) => u.id);
      const roleRows = await this.repo
        .createQueryBuilder('u')
        .leftJoin('u.userRoles', 'ur')
        .leftJoin('ur.role', 'r')
        .where('u.id IN (:...ids)', { ids })
        .select(['u.id AS uid', 'r.name AS role_name'])
        .getRawMany<{ uid: string; role_name: string | null }>();
      for (const row of roleRows) {
        if (row.role_name) {
          if (!roleMap.has(row.uid)) roleMap.set(row.uid, []);
          if (!roleMap.get(row.uid)!.includes(row.role_name))
            roleMap.get(row.uid)!.push(row.role_name);
        }
      }
    }

    return {
      data: data.map((u) => Object.assign(u, {
        roles: roleMap.get(u.id) ?? [],
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
      relations: ['userRoles', 'userRoles.role'],
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

  /** Load a user including the (normally hidden) password hash, by id. */
  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  async bulkImport(file: Express.Multer.File, actorId: string): Promise<ImportResult> {
    const rows = parseImportFile(file);
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = row['email'], fullName = row['full_name'], password = row['password'];
      if (!email) { result.errors.push({ row: i + 2, message: 'email is required' }); result.skipped++; continue; }
      if (!fullName) { result.errors.push({ row: i + 2, message: 'full_name is required' }); result.skipped++; continue; }
      if (!password) { result.errors.push({ row: i + 2, message: 'password is required' }); result.skipped++; continue; }
      try {
        await this.create({ email, fullName, password, employeeCode: row['employee_code'] || undefined, isActive: row['is_active'] !== 'false' }, actorId);
        result.created++;
      } catch (e: unknown) {
        result.errors.push({ row: i + 2, message: e instanceof Error ? e.message : 'Unknown error' });
        result.skipped++;
      }
    }
    return result;
  }

  /** Hash and set a new password for the given user (no current-password check). */
  async setPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.updatedBy = id;
    await this.repo.save(user);
  }

  /** Return users who share at least one role with the given userId, excluding themselves. */
  async findPeers(userId: string): Promise<User[]> {
    return this.repo
      .createQueryBuilder('u')
      .where(
        `u.id != :userId
         AND u.is_active = true
         AND u.deleted_at IS NULL
         AND u.id IN (
           SELECT ur2.user_id FROM user_roles ur1
           JOIN user_roles ur2 ON ur1.role_id = ur2.role_id
           WHERE ur1.user_id = :userId AND ur2.user_id != :userId
         )`,
        { userId },
      )
      .orderBy('u.full_name', 'ASC')
      .getMany();
  }

  async loadRoleCodes(userId: string): Promise<{ roles: string[]; entityIds: string[] }> {
    const rows = await this.repo
      .createQueryBuilder('u')
      .leftJoin('u.userRoles', 'ur')
      .leftJoin('ur.role', 'r')
      .where('u.id = :userId', { userId })
      .select([
        'u.id AS uid',
        'u.is_platform_admin AS is_platform_admin',
        'r.code AS role_code',
      ])
      .getRawMany<{
        uid: string;
        is_platform_admin: boolean;
        role_code: string | null;
      }>();
    const roles = new Set<string>();
    for (const r of rows) {
      if (r.role_code) roles.add(r.role_code);
    }
    // Platform admins implicitly hold SUPER_ADMIN across every entity.
    if (rows[0]?.is_platform_admin) {
      roles.add('SUPER_ADMIN');
    }
    return { roles: [...roles], entityIds: [] };
  }
}
