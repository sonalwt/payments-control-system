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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserEntityRolesService } from './user-entity-roles.service';
import { CreateUserEntityRoleDto } from './dto/create-user-entity-role.dto';
import { UpdateUserEntityRoleDto } from './dto/update-user-entity-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('User Entity Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Audit('UserEntityRole')
@Controller('user-entity-roles')
export class UserEntityRolesController {
  constructor(private readonly service: UserEntityRolesService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN)
  assign(
    @Body() dto: CreateUserEntityRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.assign(dto, user.id);
  }

  @Get('user/:id')
  forUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findForUser(id);
  }

  @Put(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserEntityRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.revoke(id);
  }
}
