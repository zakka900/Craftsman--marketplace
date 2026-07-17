/**
 * CHAT REALTIME via Socket.io + REST per storico conversazioni.
 * Il mock nell'app mobile (src/services/api.ts) va sostituito con questo gateway.
 */
import {
  Body, Controller, ForbiddenException, Get, Injectable, Module, NotFoundException,
  Param, Post, UseGuards
} from '@nestjs/common';
import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';

export class SendMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) text!: string;
  @IsOptional() @IsString() imageUrl?: string;
}

@Injectable()
@WebSocketGateway({ cors: true, namespace: '/chat' })
export class ChatGateway {
  @WebSocketServer() server!: Server;

  constructor(private prisma: PrismaService) {}

  @SubscribeMessage('join')
  join(@ConnectedSocket() socket: Socket, @MessageBody() dto: { conversationId: string }) {
    socket.join(dto.conversationId);
  }

  @SubscribeMessage('typing')
  typing(@ConnectedSocket() socket: Socket, @MessageBody() dto: { conversationId: string; from: string }) {
    socket.to(dto.conversationId).emit('typing', dto);
  }

  @SubscribeMessage('seen')
  async seen(@MessageBody() dto: { conversationId: string; messageId: string }) {
    await this.prisma.message.update({ where: { id: dto.messageId }, data: { seenAt: new Date() } });
    this.server.to(dto.conversationId).emit('seen', dto);
  }

  /** Usato dal controller REST per il broadcast dei messaggi persistiti. */
  broadcast(conversationId: string, message: unknown) {
    this.server?.to(conversationId).emit('message', message);
  }
}

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService, private gateway: ChatGateway) {}

  private async own(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('CONVERSATION_NOT_FOUND');
    if (conv.clientId !== userId) throw new ForbiddenException('NOT_YOUR_CONVERSATION');
    return conv;
  }

  list(userId: string) {
    return this.prisma.conversation.findMany({
      where: { clientId: userId },
      include: {
        artisan: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 } // anteprima ultimo messaggio
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /** Apre (o riusa) la conversazione con un artigiano. */
  async open(userId: string, artisanId: string, requestId?: string) {
    const artisan = await this.prisma.artisan.findUnique({ where: { id: artisanId } });
    if (!artisan) throw new NotFoundException('ARTISAN_NOT_FOUND');
    // findFirst+create (non upsert): il vincolo unique ha requestId nullable
    const existing = await this.prisma.conversation.findFirst({
      where: { clientId: userId, artisanId, requestId: requestId ?? null },
      include: { artisan: true }
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: { clientId: userId, artisanId, requestId },
      include: { artisan: true }
    });
  }

  async messages(userId: string, conversationId: string) {
    await this.own(userId, conversationId);
    return this.prisma.message.findMany({
      where: { conversationId }, orderBy: { createdAt: 'asc' }, take: 200
    });
  }

  async send(userId: string, conversationId: string, dto: SendMessageDto) {
    await this.own(userId, conversationId);
    const msg = await this.prisma.message.create({
      data: { conversationId, from: 'client', text: dto.text, imageUrl: dto.imageUrl }
    });
    this.gateway.broadcast(conversationId, msg);
    // TODO app artigiani: push notification all'artigiano offline
    return msg;
  }
}

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private service: ConversationsService) {}

  @Get() list(@CurrentUser() userId: string) { return this.service.list(userId); }
  @Post() open(@CurrentUser() userId: string, @Body() dto: { artisanId: string; requestId?: string }) {
    return this.service.open(userId, dto.artisanId, dto.requestId);
  }
  @Get(':id/messages') messages(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.messages(userId, id);
  }
  @Post(':id/messages') send(@CurrentUser() userId: string, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.service.send(userId, id, dto);
  }
}

@Module({
  controllers: [ConversationsController],
  providers: [ChatGateway, ConversationsService]
})
export class ChatModule {}
