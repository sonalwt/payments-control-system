import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const ALLOWED_MIMES = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);
const ALLOWED_EXTS = new Set(['.pdf', '.jpeg', '.jpg', '.png']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  @Post('file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${ext}`);
        },
      }),
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
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): { url: string; fileName: string } {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return {
      url: `/uploads/${file.filename}`,
      fileName: file.originalname,
    };
  }
}
