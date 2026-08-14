import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true → keeps the RAW body, needed to validate the Stripe webhook signature
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true
  });
  app.useLogger(app.get(Logger));

  // In production, restrict CORS to the app's origin (CORS_ORIGIN on Railway)
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger: schema automatically inferred from the DTOs (@nestjs/swagger plugin in nest-cli.json),
  // no need for manual @ApiProperty() decorators on every field.
  const swaggerDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Artisan Marketplace API')
      .setDescription('Client-artisan marketplace (GCC): requests, quotes, chat, payments, AI, RBAC.')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
  );
  SwaggerModule.setup('docs', app, swaggerDoc);

  const port = Number(process.env.PORT) || 3000; // Railway injects PORT
  await app.listen(port, '0.0.0.0');
  console.log(`API ready on port ${port} (prefix /api) — docs at /docs`);
}
bootstrap();
