/**
 * BANK VERIFICATION via GCC Open Banking — now persisted to the DB and protected by JWT.
 * REAL PROVIDER: Lean Technologies (https://leantech.me) — covers KSA, UAE.
 * Implement LeanBankProvider with link-token + confirmation webhook.
 */
import {
  Body, Controller, ForbiddenException, Get, Injectable, Module, NotFoundException,
  Param, Post, UseGuards
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';

export class StartVerificationDto {
  @IsString() @IsNotEmpty() bankId!: string;
}

export interface BankProvider {
  startVerification(userId: string, bankId: string): Promise<{ providerId: string }>;
  getStatus(providerId: string): Promise<'pending' | 'verified' | 'failed'>;
}

@Injectable()
export class MockBankProvider implements BankProvider {
  private started = new Map<string, number>();

  async startVerification(_userId: string, _bankId: string) {
    const id = `bv_${Date.now()}`;
    this.started.set(id, Date.now());
    return { providerId: id };
  }

  async getStatus(providerId: string) {
    // Simulates ~8s of waiting, then 90% success
    const t = this.started.get(providerId);
    if (!t || Date.now() - t < 8000) return 'pending' as const;
    return Math.random() < 0.9 ? ('verified' as const) : ('failed' as const);
  }
}

// TODO REAL PROVIDER:
// export class LeanBankProvider implements BankProvider { ... }

@Injectable()
export class BankVerificationService {
  constructor(private prisma: PrismaService, private provider: MockBankProvider) {}

  async start(userId: string, bankId: string) {
    const { providerId } = await this.provider.startVerification(userId, bankId);
    const record = await this.prisma.bankVerification.create({
      data: { userId, bankId, providerId }
    });
    return { verificationId: record.id };
  }

  async poll(userId: string, verificationId: string) {
    const record = await this.prisma.bankVerification.findUnique({ where: { id: verificationId } });
    if (!record?.providerId) throw new NotFoundException('VERIFICATION_NOT_FOUND');
    if (record.userId !== userId) throw new ForbiddenException('NOT_YOURS');
    if (record.status !== 'PENDING') return { status: record.status.toLowerCase() };

    const status = await this.provider.getStatus(record.providerId);
    if (status === 'verified') {
      await this.prisma.$transaction([
        this.prisma.bankVerification.update({ where: { id: verificationId }, data: { status: 'VERIFIED' } }),
        this.prisma.user.update({ where: { id: userId }, data: { bankVerified: true } }),
        this.prisma.notification.create({
          data: { userId, type: 'BANK', title: 'Bank account verified', body: 'Your payment limits have been removed.' }
        })
      ]);
    } else if (status === 'failed') {
      await this.prisma.bankVerification.update({ where: { id: verificationId }, data: { status: 'FAILED' } });
    }
    return { status };
  }

  async skip(userId: string) {
    await this.prisma.bankVerification.create({ data: { userId, bankId: 'none', status: 'SKIPPED' } });
    return { ok: true };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('bank')
export class BankVerificationController {
  constructor(private service: BankVerificationService) {}

  @Post('verify') start(@CurrentUser() userId: string, @Body() dto: StartVerificationDto) {
    return this.service.start(userId, dto.bankId);
  }
  @Get('verify/:id') poll(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.poll(userId, id);
  }
  @Post('skip') skip(@CurrentUser() userId: string) { return this.service.skip(userId); }
}

@Module({
  controllers: [BankVerificationController],
  providers: [BankVerificationService, MockBankProvider]
})
export class BankVerificationModule {}
