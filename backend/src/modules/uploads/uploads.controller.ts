import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { S3Service } from './s3.service';
import { UPLOAD_FILE_INTERCEPTOR_OPTIONS, buildUploadKey } from './upload.options';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly s3: S3Service) {}

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
}
