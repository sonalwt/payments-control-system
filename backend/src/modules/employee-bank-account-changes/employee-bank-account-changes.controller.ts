import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  EmployeeBankAccountChangesService,
  EbacQuery,
} from './employee-bank-account-changes.service';
import { CreateEbacDto } from './dto/create-ebac.dto';
import { CancelEbacDto, RejectEbacDto, VerifyEbacDto } from './dto/action-ebac.dto';

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-bank-account-changes')
export class EmployeeBankAccountChangesController {
  constructor(private readonly service: EmployeeBankAccountChangesService) {}

  /** Any initiator or above can raise a bank account change request. */
  @Post()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD, RoleCode.INITIATOR, RoleCode.PAYMENTS_MAKER)
  create(@Body() dto: CreateEbacDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @Roles(
    RoleCode.SUPER_ADMIN,
    RoleCode.FINANCE_HEAD,
    RoleCode.INITIATOR,
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.APPROVER,
  )
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    const query: EbacQuery = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      employeeId,
      status,
    };
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(
    RoleCode.SUPER_ADMIN,
    RoleCode.FINANCE_HEAD,
    RoleCode.INITIATOR,
    RoleCode.PAYMENTS_MAKER,
    RoleCode.PAYMENTS_CHECKER,
    RoleCode.APPROVER,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /** Checker verifies the request. Must not be the same user who created it. */
  @Post(':id/verify')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD, RoleCode.PAYMENTS_CHECKER)
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyEbacDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.verify(id, dto, user.id);
  }

  /** Approver gives final approval. Must not be the same user who created it. */
  @Post(':id/approve')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD, RoleCode.APPROVER)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, user.id);
  }

  @Post(':id/reject')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD, RoleCode.PAYMENTS_CHECKER, RoleCode.APPROVER)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectEbacDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, dto, user.id);
  }

  @Post(':id/cancel')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelEbacDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, dto, user.id);
  }
}
