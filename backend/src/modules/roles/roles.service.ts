import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly repo: Repository<Role>,
  ) {}

  findAll(): Promise<Role[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Role> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Role ${id} not found`);
    return r;
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.repo.findOne({ where: { code } });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    if (await this.findByCode(dto.code)) {
      throw new ConflictException(`Role code "${dto.code}" already exists`);
    }
    const r = this.repo.create({ ...dto, isSystem: false });
    return this.repo.save(r);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (role.isSystem && dto.code && dto.code !== role.code) {
      throw new BadRequestException('Cannot change the code of a system role');
    }
    Object.assign(role, dto);
    return this.repo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    await this.repo.softRemove(role);
  }
}
