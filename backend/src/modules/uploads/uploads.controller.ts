import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { S3Service } from './s3.service';

const ALLOWED_MIMES = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);
const ALLOWED_EXTS = new Set(['.pdf', '.jpeg', '.jpg', '.png']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly s3: S3Service) {}

  @Post('file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXTS.has(ext)) {
          return cb(new BadRequestException('Only PDF, JPEG, and PNG files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; fileName: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const ext = extname(file.originalname).toLowerCase();
    const key = `uploads/${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    const url = await this.s3.uploadFile(key, file.buffer, file.mimetype);
    return { url, fileName: file.originalname };
  }
}
