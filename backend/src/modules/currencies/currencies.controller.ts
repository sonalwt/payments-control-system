import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './currency.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Currencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('currencies')
export class CurrenciesController {
  constructor(
    @InjectRepository(Currency) private readonly repo: Repository<Currency>,
  ) {}

  @Get()
  findAll(): Promise<Currency[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }
}
