/**
 * AUTH — verification via EMAIL ONLY (no SMS).
 * Flow: register → 6-digit code via email → verify → JWT.
 * Login requires a verified email. Password reset is always via email code.
 * Codes are stored as sha256 hashes and expire after 10 minutes.
 */
import {
  Body, ConflictException, Controller, ForbiddenException, Injectable, Module,
  NotFoundException, Post, UnauthorizedException, UseGuards
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs'; // pure JS: no native build step (more reliable deploys)
import { createHash, randomInt } from 'crypto';
import { PrismaService } from '../prisma.service';
import { MailService } from '../common/mail.service';

// ---------------- DTO ----------------

export class RegisterDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsEmail() email!: string;
  @MinLength(8) password!: string;
  @IsIn(['SA', 'AE', 'QA', 'KW']) country!: 'SA' | 'AE' | 'QA' | 'KW';
  @IsOptional() @IsString() phone?: string; // profile info only, not verified
}

export class VerifyOtpDto {
  @IsEmail() email!: string;
  @Length(6, 6) code!: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() password!: string;
}

export class ResetPasswordDto {
  @IsEmail() email!: string;
  @Length(6, 6) code!: string;
  @MinLength(8) newPassword!: string;
}

// ---------------- SERVICE ----------------

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const OTP_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    private config: ConfigService
  ) {}

  private sign(user: { id: string; email: string; role: string }) {
    // role included in the claim: avoids a DB query on every request protected by RolesGuard
    return this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
  }

  private safe(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  /** Generates, stores (hashed) and sends an OTP code via email. */
  private async issueOtp(userId: string, email: string, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD') {
    const code = String(randomInt(100000, 1000000)); // 6 digits, crypto-safe
    await this.prisma.otpCode.deleteMany({ where: { userId, purpose, usedAt: null } });
    await this.prisma.otpCode.create({
      data: { userId, purpose, codeHash: sha256(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) }
    });
    await this.mail.sendOtp(email, code, purpose === 'VERIFY_EMAIL' ? 'verify' : 'reset');
  }

  /** Verifies an OTP code and marks it as used. */
  private async consumeOtp(userId: string, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD', code: string) {
    // Demo code allowed ONLY outside production (handy for testing the app)
    const devCode = this.config.get<string>('OTP_DEV_CODE');
    if (devCode && process.env.NODE_ENV !== 'production' && code === devCode) return;

    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, purpose, usedAt: null, codeHash: sha256(code) },
      orderBy: { createdAt: 'desc' }
    });
    if (!otp) throw new UnauthorizedException('OTP_INVALID');
    if (otp.expiresAt < new Date()) throw new UnauthorizedException('OTP_EXPIRED');
    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing?.emailVerified) throw new ConflictException('EMAIL_EXISTS');

    const phone = dto.phone?.trim() || null;
    if (phone) {
      const phoneOwner = await this.prisma.user.findUnique({ where: { phone } });
      if (phoneOwner && phoneOwner.id !== existing?.id) throw new ConflictException('PHONE_EXISTS');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const data = {
      firstName: dto.firstName.trim(), lastName: dto.lastName.trim(),
      email, phone, country: dto.country, passwordHash
    };
    const user = existing
      ? await this.prisma.user.update({ where: { id: existing.id }, data })
      : await this.prisma.user.create({ data });

    await this.issueOtp(user.id, email, 'VERIFY_EMAIL');
    return { userId: user.id, email };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) throw new NotFoundException('NOT_FOUND');
    if (user.emailVerified) throw new ConflictException('ALREADY_VERIFIED');
    await this.issueOtp(user.id, user.email, 'VERIFY_EMAIL');
    return { ok: true };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user) throw new NotFoundException('NOT_FOUND');
    await this.consumeOtp(user.id, 'VERIFY_EMAIL', dto.code);
    const updated = await this.prisma.user.update({
      where: { id: user.id }, data: { emailVerified: true }
    });
    return { token: this.sign(updated), user: this.safe(updated) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user || !user.passwordHash) throw new NotFoundException('NOT_FOUND');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('WRONG_PASSWORD');
    if (!user.emailVerified) {
      await this.issueOtp(user.id, user.email, 'VERIFY_EMAIL'); // send back to verification
      throw new ForbiddenException('NOT_VERIFIED');
    }
    return { token: this.sign(user), user: this.safe(user) };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Identical response even if the user doesn't exist (no user-enumeration)
    if (user) await this.issueOtp(user.id, user.email, 'RESET_PASSWORD');
    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user) throw new NotFoundException('NOT_FOUND');
    await this.consumeOtp(user.id, 'RESET_PASSWORD', dto.code);
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return { ok: true };
  }
}

// ---------------- CONTROLLER ----------------

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto) { return this.service.register(dto); }
  @Post('otp/resend') resend(@Body('email') email: string) { return this.service.resendOtp(email); }

  // Rate limiting: 5 attempts / minute per IP — mitigates brute-force on OTP code and password
  @UseGuards(ThrottlerGuard)
  @Post('otp/verify') verify(@Body() dto: VerifyOtpDto) { return this.service.verifyOtp(dto); }

  @UseGuards(ThrottlerGuard)
  @Post('login') login(@Body() dto: LoginDto) { return this.service.login(dto); }
  @Post('password/forgot') forgot(@Body('email') email: string) { return this.service.forgotPassword(email); }
  @Post('password/reset') reset(@Body() dto: ResetPasswordDto) { return this.service.resetPassword(dto); }
}

@Module({
  imports: [
    // global: true → JwtService available everywhere (for JwtAuthGuard in other modules)
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'), // no hardcoded fallback
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES') ?? '7d' }
      })
    }),
    // 5 requests / 60s per IP on routes that use ThrottlerGuard (login, otp/verify)
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 5 }])
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService],
  exports: [MailService]
})
export class AuthModule {}
