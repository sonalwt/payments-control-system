import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntityRole } from './user-entity-role.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { CreateUserEntityRoleDto } from './dto/create-user-entity-role.dto';
import { UpdateUserEntityRoleDto } from './dto/update-user-entity-role.dto';

@Injectable()
export class UserEntityRolesService {
  constructor(
    @InjectRepository(UserEntityRole) private readonly repo: Repository<UserEntityRole>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(LegalEntity) private readonly leRepo: Repository<LegalEntity>,
  ) {}

  async assign(dto: CreateUserEntityRoleDto, actorId: string): Promise<UserEntityRole> {
    const [user, role, le] = await Promise.all([
      this.usersRepo.findOne({ where: { id: dto.userId } }),
      this.rolesRepo.findOne({ where: { id: dto.roleId } }),
      this.leRepo.findOne({ where: { id: dto.legalEntityId } }),
    ]);
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);
    if (!role) throw new NotFoundException(`Role ${dto.roleId} not found`);
    if (!le) throw new NotFoundException(`Legal entity ${dto.legalEntityId} not found`);

    const existing = await this.repo.findOne({
      where: {
        userId: dto.userId,
        legalEntityId: dto.legalEntityId,
        roleId: dto.roleId,
      },
    });
    if (existing) {
      throw new ConflictException(
        'This user already has the role for the specified legal entity',
      );
    }

    if (dto.effectiveTo && dto.effectiveFrom && dto.effectiveTo < dto.effectiveFrom) {
      throw new BadRequestException('effectiveTo cannot precede effectiveFrom');
    }

    const entity = this.repo.create({
      userId: dto.userId,
      legalEntityId: dto.legalEntityId,
      roleId: dto.roleId,
      isActive: dto.isActive ?? true,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.repo.save(entity);
  }

  async findForUser(userId: string): Promise<UserEntityRole[]> {
    return this.repo.find({
      where: { userId },
      relations: ['legalEntity', 'role'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateUserEntityRoleDto,
    actorId: string,
  ): Promise<UserEntityRole> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Assignment ${id} not found`);
    if (dto.effectiveFrom) row.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) {
      row.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    }
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    if (row.effectiveTo && row.effectiveTo < row.effectiveFrom) {
      throw new BadRequestException('effectiveTo cannot precede effectiveFrom');
    }
    row.updatedBy = actorId;
    return this.repo.save(row);
  }

  async revoke(id: string): Promise<void> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Assignment ${id} not found`);
    await this.repo.remove(row);
  }
}
