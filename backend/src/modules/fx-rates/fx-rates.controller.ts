import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FxRatesService } from './fx-rates.service';
import { FxRateQueryDto } from './dto/fx-rate-query.dto';
import { OverrideFxRateDto } from './dto/override-fx-rate.dto';
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

  // Readable by any authenticated user — rates drive USD-equivalent displays
  // and the cross-currency min-balance check across roles.
  @Get()
  @Roles()
  findAll(@Query() query: FxRateQueryDto) {
    return this.service.findAll(query);
  }

  // The resolved rate (with staleness) for a given quote, for callers that
  // need a single value rather than the audit list.
  @Get('resolve')
  @Roles()
  resolve(
    @Query('quote') quote: string,
    @Query('date') date?: string,
  ) {
    return this.service.resolve(quote, date);
  }

  @Post('fetch')
  fetch(@CurrentUser() user: AuthenticatedUser) {
    return this.service.fetchDaily(user.id);
  }

  @Post('override')
  override(
    @Body() dto: OverrideFxRateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.override(dto, user.id);
  }
}
