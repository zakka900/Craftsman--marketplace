import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { ArtisansModule } from './modules/artisans.module';
import { RequestsModule } from './modules/requests.module';
import { QuotesModule } from './modules/quotes.module';
import { InfoRequestsModule } from './modules/info-requests.module';
import { ContractsModule } from './modules/contracts.module';
import { BankVerificationModule } from './modules/bank-verification.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChatModule } from './modules/chat.gateway';
import { NotificationsModule } from './modules/notifications.module';
import { AdminModule } from './modules/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { TranslationModule } from './modules/translation/translation.module';
import { HealthModule } from './modules/health.module';

@Global()
@Module({
  imports: [
    // All config comes from environment variables (Railway injects them from the dashboard)
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        // Log leggibili in dev, JSON strutturato (per log aggregator) in produzione
        transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
        autoLogging: { ignore: (req) => req.url === '/api/health' },
        redact: ['req.headers.authorization', 'req.headers.cookie']
      }
    }),
    AuthModule,
    UsersModule,
    ArtisansModule,
    RequestsModule,
    QuotesModule,
    InfoRequestsModule,
    ContractsModule,
    BankVerificationModule,
    PaymentsModule,
    ChatModule,
    NotificationsModule,
    AdminModule,
    AiModule,
    TranslationModule,
    HealthModule
  ],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AppModule {}
