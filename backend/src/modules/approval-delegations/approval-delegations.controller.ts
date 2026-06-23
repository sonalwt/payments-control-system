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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApprovalDelegationsService } from './approval-delegations.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Leave delegation — self-service for approvers. Any authenticated user may
 * manage their own delegations; the candidate list is APPROVER-role users.
 */
@ApiTags('Approval Delegations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approval-delegations')
export class ApprovalDelegationsController {
  constructor(private readonly service: ApprovalDelegationsService) {}

  @Get('candidates')
  candidates(@CurrentUser() user: AuthenticatedUser) {
    return this.service.candidates(user.id);
  }

  @Get('payment-types')
  paymentTypes() {
    return this.service.paymentTypes();
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.mine(user.id);
  }

  @Post()
  create(@Body() dto: CreateDelegationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.cancel(user.id, id);
  }
}
