/**
 * NOTIFICHE: lista, segna letta/tutte lette. userId dal JWT, mai da query.
 * PROVIDER REALE push: Expo Push Notifications (o FCM/APNs diretti).
 */
import {
  Controller, ForbiddenException, Get, Injectable, Module, NotFoundException,
  Param, Post, UseGuards
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: 100
    });
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('NOT_FOUND');
    if (n.userId !== userId) throw new ForbiddenException('NOT_YOURS');
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get() list(@CurrentUser() userId: string) { return this.service.list(userId); }
  @Post('read-all') readAll(@CurrentUser() userId: string) { return this.service.markAllRead(userId); }
  @Post(':id/read') read(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.markRead(userId, id);
  }
}

@Module({ controllers: [NotificationsController], providers: [NotificationsService] })
export class NotificationsModule {}
