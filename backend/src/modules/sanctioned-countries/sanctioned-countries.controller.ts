import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SanctionedCountriesService } from './sanctioned-countries.service';
import { CreateSanctionedCountryDto } from './dto/create-sanctioned-country.dto';
import { UpdateSanctionedCountryDto } from './dto/update-sanctioned-country.dto';
import { RemoveSanctionedCountryDto } from './dto/remove-sanctioned-country.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Sanctioned Countries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Audit('SanctionedCountry')
@Controller('sanctioned-countries')
export class SanctionedCountriesController {
  constructor(private readonly service: SanctionedCountriesService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN)
  create(
    @Body() dto: CreateSanctionedCountryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query()
    query: PaginationQueryDto & { isActive?: 'true' | 'false' },
  ) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSanctionedCountryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RemoveSanctionedCountryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.service.remove(id, dto.reason, user.id);
  }
}
