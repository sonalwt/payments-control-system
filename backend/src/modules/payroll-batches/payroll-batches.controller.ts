import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PayrollBatchesService, PayrollBatchQuery } from './payroll-batches.service';
import { UploadBatchDto } from './dto/upload-batch.dto';
import { CancelBatchDto, RejectBatchDto } from './dto/action-batch.dto';

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll-batches')
export class PayrollBatchesController {
  constructor(private readonly service: PayrollBatchesService) {}

  /** Upload a CSV and create a new payroll batch in DRAFT status. */
  @Post('upload')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD, RoleCode.INITIATOR, RoleCode.PAYMENTS_MAKER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are accepted'), false);
        }
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.upload(file, dto, user.id);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('status') status?: string,
    @Query('periodLabel') periodLabel?: string,
  ) {
    const query: PayrollBatchQuery = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      legalEntityId,
      status,
      periodLabel,
    };
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneWithItems(id);
  }

  /** DRAFT → PENDING_APPROVAL. Restricted to the roles that initiate payroll. */
  @Post(':id/submit')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD, RoleCode.INITIATOR, RoleCode.PAYMENTS_MAKER)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.submit(id, user.id);
  }

  /** PENDING_APPROVAL → APPROVED. Restricted to Finance Head, Approver, Super Admin. */
  @Post(':id/approve')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD, RoleCode.APPROVER)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, user.id);
  }

  /** PENDING_APPROVAL → REJECTED. Same authority as approve. */
  @Post(':id/reject')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD, RoleCode.APPROVER)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, user.id, dto);
  }

  @Post(':id/cancel')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.FINANCE_HEAD)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, user.id, dto);
  }
}
