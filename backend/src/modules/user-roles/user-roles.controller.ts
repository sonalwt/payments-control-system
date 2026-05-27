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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';

@ApiTags('User Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly service: UserRolesService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN)
  assign(@Body() dto: CreateUserRoleDto) {
    return this.service.assign(dto);
  }

  @Get('user/:id')
  @Roles(RoleCode.SUPER_ADMIN)
  forUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findForUser(id);
  }

  @Delete(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.revoke(id);
  }
}
