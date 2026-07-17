import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true → conserva il body RAW, necessario per validare la firma dei webhook Stripe
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // In produzione limitare CORS all'origine dell'app (CORS_ORIGIN su Railway)
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT) || 3000; // Railway inietta PORT
  await app.listen(port, '0.0.0.0');
  console.log(`API pronta sulla porta ${port} (prefix /api)`);
}
bootstrap();
