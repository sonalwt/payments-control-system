import { registerAs } from '@nestjs/config';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

export default registerAs<S3Config>('s3', () => ({
  region: process.env.AWS_REGION ?? 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET ?? '',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  // Optional: set for S3-compatible services (e.g. MinIO in dev)
  endpoint: process.env.AWS_S3_ENDPOINT,
}));
