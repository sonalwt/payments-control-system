import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaymentRequestMessagesService } from './payment-request-messages.service';

class AttachmentDto {
  @IsString()
  url!: string;

  @IsString()
  fileName!: string;
}

class SendMessageDto {
  @IsString()
  @MinLength(0)
  @MaxLength(2000)
  @IsOptional()
  message?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

/** Summary controller — different base path so it doesn't conflict with :id routes */
@ApiTags('Payment Request Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-request-messages')
export class PaymentRequestMessagesSummaryController {
  constructor(private readonly service: PaymentRequestMessagesService) {}

  /**
   * Returns message count + latestAt for every PR the current user participates
   * in that has at least one message. Drives notification badges on the dashboard
   * and payment request list page.
   */
  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMessageSummary(user.id);
  }
}

@ApiTags('Payment Request Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-requests/:id/messages')
export class PaymentRequestMessagesController {
  constructor(private readonly service: PaymentRequestMessagesService) {}

  /** List of other participants the current user can start a conversation with. */
  @Get('participants')
  getParticipants(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getParticipants(id, user.id);
  }

  /** All messages for this payment request (group chat). */
  @Get()
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getMessages(id, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.sendMessage(
      id,
      user.id,
      body.message ?? '',
      body.attachments ?? [],
    );
  }
}
