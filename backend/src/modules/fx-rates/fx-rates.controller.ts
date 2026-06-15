import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FxRatesService } from './fx-rates.service';
import { OverrideFxRateDto } from './dto/override-fx-rate.dto';
import { QueryFxRateDto } from './dto/query-fx-rate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('FX Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.SUPER_ADMIN)
@Controller('fx-rates')
export class FxRatesController {
  constructor(private readonly service: FxRatesService) {}

  @Get()
  @ApiOperation({ summary: 'List recorded daily FX rates (§2.2)' })
  findAll(@Query() query: QueryFxRateDto) {
    return this.service.findAll(query);
  }

  @Post('fetch')
  @ApiOperation({
    summary: "Fetch today's rates from the provider, holding stale where down",
  })
  fetch(@CurrentUser() user: AuthenticatedUser) {
    return this.service.fetchDaily(user.id);
  }

  @Post('override')
  @ApiOperation({ summary: "Manually override the day's rate (logged)" })
  override(
    @Body() dto: OverrideFxRateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.override(dto, user.id);
  }
}
