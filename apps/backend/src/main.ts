import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as sharedUtils from '@nestjs/common/utils/shared.utils';
import { AppModule } from './app.module';
import rateLimit from 'express-rate-limit';

if (typeof (sharedUtils as any).addLeadingSlash !== 'function') {
  (sharedUtils as any).addLeadingSlash = (path?: string) => {
    if (!path) {
      return '';
    }
    return path.startsWith('/') ? path : `/${path}`;
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.enableCors({ origin: true, credentials: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // Rate limiting configuration
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_AI_MAX || '10'), // Limit AI endpoints to 10 requests per window
    message: 'Too many AI requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiters
  app.use('/api/', generalLimiter);
  app.use('/api/ai/', aiLimiter);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Unscroller Backend running on http://localhost:${port}`);

  try {
    const server: any = app.getHttpAdapter().getHttpServer();
    const router = server?._events?.request?._router;
    if (router?.stack) {
      const routes = router.stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => {
          const methods = Object.keys(layer.route.methods)
            .filter(method => layer.route.methods[method])
            .map(method => method.toUpperCase())
            .join(',');
          return `${methods} ${layer.route.path}`;
        });
      console.log('[Routes]', routes);
    }
  } catch (error) {
    console.warn('[Routes] Failed to enumerate routes:', error);
  }
}

bootstrap();
