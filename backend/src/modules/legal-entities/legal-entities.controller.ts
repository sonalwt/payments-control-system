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
import { LegalEntitiesService } from './legal-entities.service';
import { CreateLegalEntityDto } from './dto/create-legal-entity.dto';
import { UpdateLegalEntityDto } from './dto/update-legal-entity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Legal Entities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Audit('LegalEntity')
@Controller('legal-entities')
export class LegalEntitiesController {
  constructor(private readonly service: LegalEntitiesService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SYSTEM_ADMIN)
  create(
    @Body() dto: CreateLegalEntityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto & { groupId?: string }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SYSTEM_ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLegalEntityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.remove(id, user.id);
  }
}
