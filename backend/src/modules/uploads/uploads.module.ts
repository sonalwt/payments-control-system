import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { S3Service } from './s3.service';
import { DocumentExtractionService } from './document-extraction.service';

@Module({
  controllers: [UploadsController],
  providers: [S3Service, DocumentExtractionService],
  exports: [S3Service],
})
export class UploadsModule {}
