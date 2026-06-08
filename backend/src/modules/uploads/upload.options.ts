import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { extname } from 'path';

/**
 * Shared multipart-upload configuration used by every file-upload route
 * (staff Uploads controller and the employee self-service portal) so the
 * accepted types, size limit and key scheme stay identical across realms.
 */

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  // §8.1 — bank statement uploads (CSV with configurable mapping + spreadsheets)
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream', // some browsers send this for .csv
]);
const ALLOWED_EXTS = new Set(['.pdf', '.jpeg', '.jpg', '.png', '.csv', '.xls', '.xlsx']);

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const UPLOAD_FILE_INTERCEPTOR_OPTIONS: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXTS.has(ext)) {
      return cb(new BadRequestException('Only PDF, JPEG, and PNG files are allowed'), false);
    }
    cb(null, true);
  },
};

/** Build the S3 object key for an uploaded file, preserving its extension. */
export function buildUploadKey(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  return `uploads/${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
}
