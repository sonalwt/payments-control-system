import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe,
  Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentTypesService } from './payment-types.service';
import { CreatePaymentTypeDto } from './dto/create-payment-type.dto';
import { UpdatePaymentTypeDto } from './dto/update-payment-type.dto';
import { PaymentTypesQueryDto } from './dto/payment-types-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Read endpoints (GET) are open to every authenticated user so the
 * payment-request form can present the catalogue, optionally filtered
 * to "payment types the current user can act as Maker for" via ?mine.
 *
 * Mutating endpoints stay SUPER_ADMIN only.
 */
@ApiTags('Payment Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payment-types')
export class PaymentTypesController {
  constructor(private readonly service: PaymentTypesService) {}

  @Post()
  @Roles(RoleCode.SUPER_ADMIN)
  create(@Body() dto: CreatePaymentTypeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: PaymentTypesQueryDto, @CurrentUser() user: AuthenticatedUser) {
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
    @Body() dto: UpdatePaymentTypeDto,
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
