import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe,
  Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApprovalMatricesService } from './approval-matrices.service';
import { CreateApprovalMatrixDto } from './dto/create-approval-matrix.dto';
import { UpdateApprovalMatrixDto } from './dto/update-approval-matrix.dto';
import { MatricesQueryDto } from './dto/matrices-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Read endpoints (GET) are open to every authenticated user; the
 * service applies the ?mine filter for non-admin / non-counterparty
 * users so they only see matrices they participate in.
 *
 * Mutating endpoints (POST / PUT / DELETE) remain SUPER_ADMIN only —
 * only the admin can author authority matrices.
 */
@ApiTags('Approval Matrices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approval-matrices')
export class ApprovalMatricesController {
  constructor(private readonly service: ApprovalMatricesService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN)
  create(@Body() dto: CreateApprovalMatrixDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: MatricesQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(query, user.id);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApprovalMatrixDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id);
  }
}
