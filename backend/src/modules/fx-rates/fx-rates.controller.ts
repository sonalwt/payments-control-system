import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FxRatesService } from './fx-rates.service';
import { OverrideFxRateDto } from './dto/override-fx-rate.dto';
import { FetchRatesDto } from './dto/fetch-rates.dto';
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

@ApiTags('FX Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Audit('FxRate')
@Controller('fx-rates')
export class FxRatesController {
  constructor(private readonly service: FxRatesService) {}

  /** List persisted rate rows (most-recent first), filterable by base/quote/date. */
  @Get()
  list(
    @Query()
    query: PaginationQueryDto & {
      base?: string;
      quote?: string;
      asOfDate?: string;
    },
  ) {
    return this.service.list(query);
  }

  /**
   * Resolved rate for a single quote currency, with stale-rate indicator.
   * Used by USD-equivalent displays and the cross-currency min-balance check.
   */
  @Get('latest/:quote')
  getLatest(
    @Param('quote') quote: string,
    @Query('asOfDate') asOfDate?: string,
    @Query('base') base?: string,
  ) {
    return this.service.getRate(quote, asOfDate, base);
  }

  /** Trigger an immediate provider fetch (also runnable on a cron). */
  @Post('fetch')
  @Roles(RoleCode.SUPER_ADMIN)
  fetchNow(@Body() dto: FetchRatesDto) {
    return this.service.fetchDaily(dto.asOfDate, dto.baseCurrencyCode);
  }

  /** Manual override — logged with reason. */
  @Post('override')
  @Roles(RoleCode.SUPER_ADMIN)
  override(
    @Body() dto: OverrideFxRateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.overrideRate(dto, user.id);
  }
}
