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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IncomingReceiptsService } from './incoming-receipts.service';
import {
  CancelReceiptDto,
  CreateIncomingReceiptDto,
  IncomingReceiptQueryDto,
  MarkReceivedDto,
  UpdateIncomingReceiptDto,
} from './dto/incoming-receipt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Incoming Receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  RoleCode.SUPER_ADMIN,
  RoleCode.INITIATOR,
  RoleCode.CHECKER,
  RoleCode.APPROVER_1,
  RoleCode.APPROVER_2,
)
@Controller('incoming-receipts')
export class IncomingReceiptsController {
  constructor(private readonly service: IncomingReceiptsService) {}

  @Post()
  create(@Body() dto: CreateIncomingReceiptDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: IncomingReceiptQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/documents')
  listDocuments(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.listDocuments(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateIncomingReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Post(':id/submit')
  submit(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.submit(id, user.id);
  }

  @Post(':id/mark-received')
  markReceived(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MarkReceivedDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.markReceived(id, dto, user.id);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancel(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id);
  }
}
