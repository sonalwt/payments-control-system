import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('app.port');
  const prefix = config.getOrThrow<string>('app.apiPrefix');
  const corsOrigin = config.getOrThrow<string>('app.corsOrigin');

  app.setGlobalPrefix(prefix);

  // Serve uploaded files as static assets at /uploads/...
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Payments Control System — Section 1.1')
    .setDescription('Entities & Organisational Structure')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, swaggerDoc);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend ready on http://localhost:${port}/${prefix}`);
}

void bootstrap();
