import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DelegationsService } from './delegations.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';

@ApiTags('Delegations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delegations')
export class DelegationsController {
  constructor(private readonly service: DelegationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a delegation' })
  create(@Body() dto: CreateDelegationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(user.id, dto);
  }

  @Get('outgoing')
  @ApiOperation({ summary: 'Get my outgoing delegations' })
  outgoing(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findOutgoing(user.id);
  }

  @Get('incoming')
  @ApiOperation({ summary: 'Get delegations assigned to me' })
  incoming(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findIncoming(user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a delegation' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.cancel(id, user.id);
  }
}
