import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe,
  Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CounterpartiesService } from './counterparties.service';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';
import { CounterpartyQueryDto } from './dto/counterparty-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Counterparties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.SUPER_ADMIN, RoleCode.COUNTERPARTY)
@Controller('counterparties')
export class CounterpartiesController {
  constructor(private readonly service: CounterpartiesService) {}

  @Post()
  create(@Body() dto: CreateCounterpartyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @Roles()
  findAll(@Query() query: CounterpartyQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles()
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCounterpartyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id);
  }
}
