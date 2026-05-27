import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/user-role.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRole) private readonly repo: Repository<UserRole>,
    @InjectRepository(User)     private readonly usersRepo: Repository<User>,
    @InjectRepository(Role)     private readonly rolesRepo: Repository<Role>,
  ) {}

  async assign(dto: CreateUserRoleDto): Promise<UserRole> {
    const user = await this.usersRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const role = await this.rolesRepo.findOne({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException(`Role ${dto.roleId} not found`);

    const existing = await this.repo.findOne({
      where: { userId: dto.userId, roleId: dto.roleId },
    });
    if (existing) throw new ConflictException('This user already has this role');

    const ur = this.repo.create({ userId: dto.userId, roleId: dto.roleId });
    return this.repo.save(ur);
  }

  findForUser(userId: string): Promise<UserRole[]> {
    return this.repo.find({
      where: { userId },
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(id: string): Promise<void> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Assignment ${id} not found`);
    await this.repo.remove(row);
  }
}
