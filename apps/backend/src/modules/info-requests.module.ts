/** INFO REQUESTS artisan→client: question + reply with text and photos, saved to history. */
import {
  Body, Controller, ForbiddenException, Get, Injectable, Module, NotFoundException,
  Param, Post, UseGuards
} from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';

export class ReplyDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) text!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(6) photos?: string[];
}

@Injectable()
export class InfoRequestsService {
  constructor(private prisma: PrismaService) {}

  async listByRequest(userId: string, requestId: string) {
    const req = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('REQUEST_NOT_FOUND');
    if (req.clientId !== userId) throw new ForbiddenException('NOT_YOUR_REQUEST');
    return this.prisma.infoRequest.findMany({ where: { requestId }, include: { artisan: true } });
  }

  async reply(userId: string, id: string, dto: ReplyDto) {
    const info = await this.prisma.infoRequest.findUnique({ where: { id }, include: { request: true } });
    if (!info) throw new NotFoundException('INFO_REQUEST_NOT_FOUND');
    if (info.request.clientId !== userId) throw new ForbiddenException('NOT_YOUR_REQUEST');

    const [updated] = await this.prisma.$transaction([
      this.prisma.infoRequest.update({
        where: { id },
        data: { replyText: dto.text, replyPhotos: dto.photos ?? [], repliedAt: new Date() }
      }),
      this.prisma.requestEvent.create({
        data: { requestId: info.requestId, type: 'info', text: 'Client replied to info request' }
      })
      // TODO artisan app: push notification to the artisan
    ]);
    return updated;
  }
}

@UseGuards(JwtAuthGuard)
@Controller('info-requests')
export class InfoRequestsController {
  constructor(private service: InfoRequestsService) {}

  @Get('request/:requestId') list(@CurrentUser() userId: string, @Param('requestId') id: string) {
    return this.service.listByRequest(userId, id);
  }
  @Post(':id/reply') reply(@CurrentUser() userId: string, @Param('id') id: string, @Body() dto: ReplyDto) {
    return this.service.reply(userId, id, dto);
  }
}

@Module({ controllers: [InfoRequestsController], providers: [InfoRequestsService] })
export class InfoRequestsModule {}
