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

  /** Upload a CSV and create a new payroll batch in DRAFT status. §5.1 — HR initiates. */
  @Post('upload')
  @Roles(RoleCode.HR_INITIATOR, RoleCode.SUPER_ADMIN)
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

  /** DRAFT → PENDING_APPROVAL. §5.1 — HR submits the uploaded batch. */
  @Post(':id/submit')
  @Roles(RoleCode.HR_INITIATOR, RoleCode.SUPER_ADMIN)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.submit(id, user.id);
  }

  /** PENDING_APPROVAL → APPROVED. §5.2 — batch-level approval by Payroll Approver. */
  @Post(':id/approve')
  @Roles(RoleCode.PAYROLL_APPROVER, RoleCode.SUPER_ADMIN)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, user.id);
  }

  /** PENDING_APPROVAL → REJECTED. Same authority as approve. */
  @Post(':id/reject')
  @Roles(RoleCode.PAYROLL_APPROVER, RoleCode.SUPER_ADMIN)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, user.id, dto);
  }

  @Post(':id/cancel')
  @Roles(RoleCode.SYSTEM_ADMIN, RoleCode.SUPER_ADMIN)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, user.id, dto);
  }
}
