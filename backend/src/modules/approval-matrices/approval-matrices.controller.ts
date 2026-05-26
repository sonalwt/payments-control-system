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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApprovalMatricesService } from './approval-matrices.service';
import { CreateApprovalMatrixDto } from './dto/create-approval-matrix.dto';
import { UpdateApprovalMatrixDto } from './dto/update-approval-matrix.dto';
import { ResolveChainDto } from './dto/resolve-chain.dto';
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
import { ApprovalMatrixStatus } from './approval-matrix.entity';

@ApiTags('Approval Matrices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Audit('ApprovalMatrix')
@Controller('approval-matrices')
export class ApprovalMatricesController {
  constructor(private readonly service: ApprovalMatricesService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SYSTEM_ADMIN)
  create(
    @Body() dto: CreateApprovalMatrixDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @ApiQuery({ name: 'paymentTypeCode', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ApprovalMatrixStatus })
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('paymentTypeCode') paymentTypeCode?: string,
    @Query('status') status?: ApprovalMatrixStatus,
  ) {
    return this.service.findAll({ ...query, paymentTypeCode, status });
  }

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  resolve(@Body() dto: ResolveChainDto) {
    return this.service.resolveChain(dto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SYSTEM_ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApprovalMatrixDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Post(':id/publish')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  publish(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.publish(id, user.id);
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
