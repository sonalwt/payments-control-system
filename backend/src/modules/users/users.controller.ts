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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @Roles(RoleCode.SUPER_ADMIN)
  findAll(@Query() query: UsersQueryDto) {
    return this.service.findAll(query);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(user.id);
  }

  @Get(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.remove(id, user.id);
  }

  @Post('import')
  @Roles(RoleCode.SUPER_ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async importFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.bulkImport(file, user.id);
  }
}
