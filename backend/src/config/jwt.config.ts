import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export default registerAs<JwtConfig>('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'change_me_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
}));
