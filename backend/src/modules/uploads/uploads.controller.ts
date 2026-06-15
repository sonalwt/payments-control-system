import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { S3Service } from './s3.service';
import { UPLOAD_FILE_INTERCEPTOR_OPTIONS, buildUploadKey } from './upload.options';
import {
  DocumentExtractionService,
  ExtractedInvoice,
  ExtractedRemittance,
} from './document-extraction.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly s3: S3Service,
    private readonly docExtraction: DocumentExtractionService,
  ) {}

  @Post('file')
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
   * Best-effort, fully-local read of an uploaded invoice PDF for cross-checking
   * against the values the user typed into the form. The file is NOT stored
   * here (the form uploads it separately) and nothing leaves the server — the
   * text layer is parsed in-process. Results are advisory only (warn-only).
   */
  @Post('extract-invoice')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', UPLOAD_FILE_INTERCEPTOR_OPTIONS))
  async extractInvoice(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExtractedInvoice> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.docExtraction.extractInvoice(file.buffer, file.mimetype);
  }

  /**
   * Best-effort, fully-local read of an uploaded bank remittance / SWIFT /
   * MT103 copy for cross-checking the reference number + amount the treasury
   * maker entered against the document. Not stored here; advisory only.
   */
  @Post('extract-remittance')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', UPLOAD_FILE_INTERCEPTOR_OPTIONS))
  async extractRemittance(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExtractedRemittance> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.docExtraction.extractRemittance(file.buffer, file.mimetype);
  }

  /**
   * Mint a short-lived presigned URL for viewing or downloading a stored file.
   * Keeps the bucket private — the SPA never touches a public object URL.
   * `download=1` makes the browser save the file (attachment) instead of
   * opening it inline.
   */
  @Get('presign')
  async presign(
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
}
