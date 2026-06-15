import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { EmployeeAuth } from '../../common/decorators/employee-auth.decorator';
import {
  AuthenticatedEmployee,
  CurrentEmployee,
} from '../../common/decorators/current-employee.decorator';
import { PaymentRequestsService } from '../payment-requests/payment-requests.service';
import { PaymentTypesService } from '../payment-types/payment-types.service';
import { BeneficiaryAccountsService } from '../beneficiary-accounts/beneficiary-accounts.service';
import { S3Service } from '../uploads/s3.service';
import {
  UPLOAD_FILE_INTERCEPTOR_OPTIONS,
  buildUploadKey,
} from '../uploads/upload.options';
import { CreateEmployeeReimbursementDto } from '../payment-requests/dto/create-employee-reimbursement.dto';
import { WithdrawDto } from '../payment-requests/dto/action.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

/**
 * Employee self-service portal. Every route runs in the employee realm
 * (@EmployeeAuth) — staff/user tokens are rejected, and the employee can
 * only ever see or act on their own data. Requests raised here become
 * ordinary payment requests and flow through the existing approval matrix.
 */
@ApiTags('Employee Portal')
@EmployeeAuth()
@Controller('employee')
export class EmployeePortalController {
  constructor(
    private readonly requests: PaymentRequestsService,
    private readonly paymentTypes: PaymentTypesService,
    private readonly beneficiaries: BeneficiaryAccountsService,
    private readonly s3: S3Service,
  ) {}

  /**
   * Upload a supporting document (receipt/invoice) for a reimbursement.
   * Mirrors the staff POST /uploads/file but lives in the employee realm so
   * an employee token is accepted. Returns the stored URL to attach via the
   * `documents` array on POST /employee/payment-requests.
   */
  @Post('uploads/file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', UPLOAD_FILE_INTERCEPTOR_OPTIONS))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; fileName: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const key = buildUploadKey(file.originalname);
    const url = await this.s3.uploadFile(key, file.buffer, file.mimetype);
    return { url, fileName: file.originalname };
  }

  /**
   * Presign a stored file for inline view or download, in the employee realm.
   * Mirrors the staff GET /uploads/presign so the shared detail view works for
   * employees without exposing a staff token or a public bucket URL.
   */
  @Get('uploads/presign')
  async presignFile(
    @Query('url') url?: string,
    @Query('download') download?: string,
    @Query('fileName') fileName?: string,
  ): Promise<{ url: string }> {
    if (!url) throw new BadRequestException('url is required');
    const key = this.s3.keyFromUrl(url);
    if (!key.startsWith('uploads/')) {
      throw new BadRequestException('Invalid file reference');
    }
    const signed = await this.s3.presignGetUrl(url, {
      download: download === '1' || download === 'true',
      fileName,
    });
    return { url: signed };
  }

  /** Payment types this employee can select when raising a request. */
  @Get('payment-types')
  listPaymentTypes(@CurrentEmployee() emp: AuthenticatedEmployee) {
    return this.paymentTypes.findEmployeeSelectable(emp.legalEntityId);
  }

  /** The employee's own payable beneficiary accounts. */
  @Get('beneficiary-accounts')
  listBeneficiaryAccounts(@CurrentEmployee() emp: AuthenticatedEmployee) {
    return this.beneficiaries.findAll({
      page: 1,
      limit: 500,
      employeeId: emp.id,
      payableOnly: 'true',
    });
  }

  @Post('payment-requests')
  create(
    @Body() dto: CreateEmployeeReimbursementDto,
    @CurrentEmployee() emp: AuthenticatedEmployee,
  ) {
    return this.requests.createForEmployee(dto, emp.id);
  }

  @Get('payment-requests')
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentEmployee() emp: AuthenticatedEmployee,
  ) {
    return this.requests.findAllForEmployee(emp.id, query);
  }

  @Get('payment-requests/:id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentEmployee() emp: AuthenticatedEmployee,
  ) {
    return this.requests.findOneForEmployee(id, emp.id);
  }

  @Post('payment-requests/:id/submit')
  submit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentEmployee() emp: AuthenticatedEmployee,
  ) {
    return this.requests.submitForEmployee(id, emp.id);
  }

  @Post('payment-requests/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  withdraw(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: WithdrawDto,
    @CurrentEmployee() emp: AuthenticatedEmployee,
  ) {
    return this.requests.withdrawForEmployee(id, emp.id, dto);
  }
}
