import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Global()
@Module({
  imports: [
    // Tutte le config da variabili d'ambiente (Railway le inietta dal dashboard)
    ConfigModule.forRoot({ isGlobal: true }),
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
    NotificationsModule
  ],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AppModule {}
