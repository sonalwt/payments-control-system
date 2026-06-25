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
import { parseImportFile, ImportResult } from '../../common/helpers/parse-import-file';

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
    await this.repo.softRemove(role);
  }

  async bulkImport(file: Express.Multer.File): Promise<ImportResult> {
    const rows = parseImportFile(file);
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = row['code'];
      const name = row['name'];
      if (!code) { result.errors.push({ row: i + 2, message: 'code is required' }); result.skipped++; continue; }
      if (!name) { result.errors.push({ row: i + 2, message: 'name is required' }); result.skipped++; continue; }
      try {
        await this.create({ code, name, description: row['description'] || undefined });
        result.created++;
      } catch (e: unknown) {
        result.errors.push({ row: i + 2, message: e instanceof Error ? e.message : 'Unknown error' });
        result.skipped++;
      }
    }
    return result;
  }
}
