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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatementUploadsService } from './statement-uploads.service';
import { CreateStatementUploadDto } from './dto/create-statement-upload.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('statement-uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('statement-uploads')
export class StatementUploadsController {
  constructor(private readonly service: StatementUploadsService) {}

  @Post()
  @Roles(RoleCode.PAYMENTS_MAKER, RoleCode.FINANCE_HEAD, RoleCode.SUPER_ADMIN)
  create(
    @Body() dto: CreateStatementUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @Roles(
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.FINANCE_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  findAll(
    @Query() query: PaginationQueryDto & { bankAccountId?: string },
  ) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.FINANCE_HEAD,
    RoleCode.SUPER_ADMIN,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleCode.FINANCE_HEAD, RoleCode.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
