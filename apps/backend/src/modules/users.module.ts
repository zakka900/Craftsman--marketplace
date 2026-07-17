/** UTENTI: profilo, preferenze lingua, eliminazione account (PDPL: anonimizzazione dati). */
import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Patch, UseGuards
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';

export class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsIn(['en', 'ar']) language?: 'en' | 'ar';
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('NOT_FOUND');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    const { passwordHash, ...safe } = user;
    return safe;
  }

  /** PDPL (UAE/KSA): anonimizzazione — i dati personali vengono rimossi, lo storico resta aggregato. */
  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: 'Deleted', lastName: 'User',
        email: `deleted_${userId}@removed.local`, phone: null,
        passwordHash: null, socialId: null, emailVerified: false
      }
    });
    return { ok: true };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('me') me(@CurrentUser() userId: string) { return this.service.me(userId); }
  @Patch('me') update(@CurrentUser() userId: string, @Body() dto: UpdateProfileDto) {
    return this.service.update(userId, dto);
  }
  @Delete('me') remove(@CurrentUser() userId: string) { return this.service.deleteAccount(userId); }
}

@Module({ controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}
