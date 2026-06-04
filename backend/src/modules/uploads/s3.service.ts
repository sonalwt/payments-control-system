import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { S3Config } from '../../config/s3.config';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string | undefined;

  constructor(private readonly config: ConfigService) {
    const s3 = config.getOrThrow<S3Config>('s3');
    this.bucket = s3.bucket;
    this.region = s3.region;
    this.endpoint = s3.endpoint;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
      ...(this.endpoint ? { endpoint: this.endpoint, forcePathStyle: true } : {}),
    });
  }

  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (this.endpoint) {
      // S3-compatible endpoint (e.g. MinIO): path-style URL
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch {
      // Deletion failures are non-fatal — log and continue
    }
  }
}
