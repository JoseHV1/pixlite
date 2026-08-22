import './load-env';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Apache sits in front of this app as a single reverse-proxy hop (see
  // DEPLOY.md) and forwards the real client IP via X-Forwarded-For. Without
  // this, req.ip always resolves to the proxy's own address, so every
  // visitor collapses into one shared bucket for the per-IP rate limiters
  // in notifications/*.controller.ts.
  app.set('trust proxy', 1);
  const corsOriginEnv = process.env.CORS_ORIGIN ?? 'http://localhost:4200';
  app.enableCors({
    origin: corsOriginEnv === '*' ? true : corsOriginEnv.split(',').map((origin) => origin.trim()),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
