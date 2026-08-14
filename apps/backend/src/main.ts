import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true → conserva il body RAW, necessario per validare la firma dei webhook Stripe
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true
  });
  app.useLogger(app.get(Logger));

  // In produzione limitare CORS all'origine dell'app (CORS_ORIGIN su Railway)
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger: schema inferito automaticamente dai DTO (plugin @nestjs/swagger in nest-cli.json),
  // niente @ApiProperty() manuali su ogni campo.
  const swaggerDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Artisan Marketplace API')
      .setDescription('Marketplace clienti-artigiani (GCC): richieste, preventivi, chat, pagamenti, AI, RBAC.')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
  );
  SwaggerModule.setup('docs', app, swaggerDoc);

  const port = Number(process.env.PORT) || 3000; // Railway inietta PORT
  await app.listen(port, '0.0.0.0');
  console.log(`API pronta sulla porta ${port} (prefix /api) — docs su /docs`);
}
bootstrap();
