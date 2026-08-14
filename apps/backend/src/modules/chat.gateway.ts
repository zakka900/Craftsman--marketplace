/**
 * REALTIME CHAT via Socket.io + REST for conversation history.
 * The mock in the mobile app (src/services/api.ts) needs to be replaced with this gateway.
 */
import {
  BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, Module,
  NotFoundException, Param, Post, UseGuards
} from '@nestjs/common';
import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { detectContactInfo } from '../common/contact-detector';
import { contactsUnlockedForStatus } from '../common/job-state-machine';
import { AiModule } from './ai/ai.module';
import { AiService } from './ai/ai.service';

export class SendMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) text!: string;
  @IsOptional() @IsString() imageUrl?: string;
}

// The global ValidationPipe (main.ts, whitelist: true) also applies to WebSocket
// handlers: without real classes decorated with class-validator, the payload would
// be silently stripped to nothing (no "recognized" properties to keep).
export class JoinRoomDto {
  @IsString() @IsNotEmpty() conversationId!: string;
}
export class TypingDto {
  @IsString() @IsNotEmpty() conversationId!: string;
  @IsString() @IsNotEmpty() from!: string;
}
export class SeenDto {
  @IsString() @IsNotEmpty() conversationId!: string;
  @IsString() @IsNotEmpty() messageId!: string;
}

@Injectable()
@WebSocketGateway({ cors: true, namespace: '/chat' })
export class ChatGateway {
  @WebSocketServer() server!: Server;

  constructor(private prisma: PrismaService) {}

  @SubscribeMessage('join')
  join(@ConnectedSocket() socket: Socket, @MessageBody() dto: JoinRoomDto) {
    socket.join(dto.conversationId);
  }

  @SubscribeMessage('typing')
  typing(@ConnectedSocket() socket: Socket, @MessageBody() dto: TypingDto) {
    socket.to(dto.conversationId).emit('typing', dto);
  }

  @SubscribeMessage('seen')
  async seen(@MessageBody() dto: SeenDto) {
    await this.prisma.message.update({ where: { id: dto.messageId }, data: { seenAt: new Date() } });
    this.server.to(dto.conversationId).emit('seen', dto);
  }

  /** Used by the REST controller to broadcast persisted messages. */
  broadcast(conversationId: string, message: unknown) {
    this.server?.to(conversationId).emit('message', message);
  }

  /** Real-time "artisan is typing" notification when the AI starts generating a reply. */
  broadcastTyping(conversationId: string, typing: boolean) {
    this.server?.to(conversationId).emit('typing', { conversationId, from: 'artisan', typing });
  }
}

@Injectable()
export class ConversationsService {
  /** Conversations with an AI reply currently "typing" — in-memory state, fine for a single-process demo. */
  private pendingReplies = new Set<string>();

  constructor(private prisma: PrismaService, private gateway: ChatGateway, private ai: AiService) {}

  private async own(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('CONVERSATION_NOT_FOUND');
    if (conv.clientId !== userId) throw new ForbiddenException('NOT_YOUR_CONVERSATION');
    return conv;
  }

  /**
   * Contact unlock: a conversation without a linked request always stays moderated
   * (no accepted contract = no exception to anti-circumvention).
   */
  private async contactsUnlocked(requestId: string | null): Promise<boolean> {
    if (!requestId) return false;
    const req = await this.prisma.request.findUnique({ where: { id: requestId }, select: { status: true } });
    return contactsUnlockedForStatus(req?.status);
  }

  async list(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { clientId: userId },
      include: {
        artisan: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 } // last message preview
      },
      orderBy: { createdAt: 'desc' }
    });
    return Promise.all(
      convs.map(async (c) => ({
        ...c, contactsUnlocked: await this.contactsUnlocked(c.requestId),
        artisanTyping: this.pendingReplies.has(c.id)
      }))
    );
  }

  /** Opens (or reuses) the conversation with an artisan. */
  async open(userId: string, artisanId: string, requestId?: string) {
    const artisan = await this.prisma.artisan.findUnique({ where: { id: artisanId } });
    if (!artisan) throw new NotFoundException('ARTISAN_NOT_FOUND');
    // findFirst+create (not upsert): the unique constraint has a nullable requestId
    const existing = await this.prisma.conversation.findFirst({
      where: { clientId: userId, artisanId, requestId: requestId ?? null },
      include: { artisan: true }
    });
    const conv = existing ?? await this.prisma.conversation.create({
      data: { clientId: userId, artisanId, requestId },
      include: { artisan: true }
    });
    return {
      ...conv, contactsUnlocked: await this.contactsUnlocked(conv.requestId),
      artisanTyping: this.pendingReplies.has(conv.id)
    };
  }

  async messages(userId: string, conversationId: string) {
    await this.own(userId, conversationId);
    return this.prisma.message.findMany({
      where: { conversationId }, orderBy: { createdAt: 'asc' }, take: 200
    });
  }

  async send(userId: string, conversationId: string, dto: SendMessageDto) {
    const conv = await this.own(userId, conversationId);

    if (!(await this.contactsUnlocked(conv.requestId))) {
      const { blocked } = detectContactInfo(dto.text);
      if (blocked) throw new BadRequestException('CONTACT_INFO_BLOCKED');
    }

    const msg = await this.prisma.message.create({
      data: { conversationId, from: 'client', text: dto.text, imageUrl: dto.imageUrl }
    });
    this.gateway.broadcast(conversationId, msg);
    // No real artisan app: the AI replies on behalf of the artisan (doesn't block the reply to the client).
    this.triggerArtisanReply(conversationId).catch(() => {});
    return msg;
  }

  /** Generates and publishes an AI reply "on behalf of" the artisan, with a delay that simulates human typing. */
  private async triggerArtisanReply(conversationId: string) {
    if (this.pendingReplies.has(conversationId)) return; // already in progress
    this.pendingReplies.add(conversationId);
    this.gateway.broadcastTyping(conversationId, true);
    try {
      const conv = await this.prisma.conversation.findUnique({
        where: { id: conversationId }, include: { artisan: true }
      });
      if (!conv) return;

      const history = await this.prisma.message.findMany({
        where: { conversationId }, orderBy: { createdAt: 'asc' }, take: 20
      });
      const lastClientMsg = [...history].reverse().find((m) => m.from === 'client');
      if (!lastClientMsg) return;

      const reply = await this.ai.replyAsArtisan({
        artisanName: conv.artisan.name,
        categoryId: conv.artisan.categoryId,
        history: history.slice(0, -1).map((m) => ({ from: m.from === 'client' ? 'client' : 'artisan', text: m.text })),
        clientMessage: lastClientMsg.text
      });

      // Realistic delay: feels like a human typing, not an instant reply
      await new Promise((r) => setTimeout(r, 1800 + Math.random() * 1800));

      const artisanMsg = await this.prisma.message.create({
        data: { conversationId, from: 'artisan', text: reply }
      });
      this.gateway.broadcast(conversationId, artisanMsg);
      await this.prisma.notification.create({
        data: { userId: conv.clientId, type: 'CHAT', title: conv.artisan.name, body: reply, conversationId }
      });
    } finally {
      this.pendingReplies.delete(conversationId);
      this.gateway.broadcastTyping(conversationId, false);
    }
  }

  /**
   * Seeds 1-2 demo conversations on first access (none present yet): one already with a
   * message from the artisan, the other shown as "typing" and completed shortly after.
   */
  async seedDemo(userId: string) {
    const existingCount = await this.prisma.conversation.count({ where: { clientId: userId } });
    if (existingCount > 0) return { seeded: false };

    const artisans = await this.prisma.artisan.findMany({ take: 2 });
    if (artisans.length < 2) return { seeded: false };
    const [a1, a2] = artisans;
    const greeting = '(You are starting the conversation. Greet the client warmly and ask how you can help with their job.)';

    const conv1 = await this.prisma.conversation.create({ data: { clientId: userId, artisanId: a1.id } });
    const opener1 = await this.ai.replyAsArtisan({
      artisanName: a1.name, categoryId: a1.categoryId, history: [], clientMessage: greeting
    });
    await this.prisma.message.create({ data: { conversationId: conv1.id, from: 'artisan', text: opener1 } });
    await this.prisma.notification.create({
      data: { userId, type: 'CHAT', title: a1.name, body: opener1, conversationId: conv1.id }
    });

    const conv2 = await this.prisma.conversation.create({ data: { clientId: userId, artisanId: a2.id } });
    this.pendingReplies.add(conv2.id); // immediately visible as "typing"
    this.gateway.broadcastTyping(conv2.id, true);
    this.triggerDemoOpener(conv2.id, a2).catch(() => {});

    return { seeded: true };
  }

  private async triggerDemoOpener(conversationId: string, artisan: { name: string; categoryId: string }) {
    try {
      const opener = await this.ai.replyAsArtisan({
        artisanName: artisan.name, categoryId: artisan.categoryId, history: [],
        clientMessage: '(You are starting the conversation. Greet the client warmly and ask how you can help with their job.)'
      });
      await new Promise((r) => setTimeout(r, 4000 + Math.random() * 2000));
      const msg = await this.prisma.message.create({ data: { conversationId, from: 'artisan', text: opener } });
      this.gateway.broadcast(conversationId, msg);
      const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conv) {
        await this.prisma.notification.create({
          data: { userId: conv.clientId, type: 'CHAT', title: artisan.name, body: opener, conversationId }
        });
      }
    } finally {
      this.pendingReplies.delete(conversationId);
      this.gateway.broadcastTyping(conversationId, false);
    }
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
  @Post('seed-demo') seedDemo(@CurrentUser() userId: string) { return this.service.seedDemo(userId); }
  @Get(':id/messages') messages(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.messages(userId, id);
  }
  @Post(':id/messages') send(@CurrentUser() userId: string, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.service.send(userId, id, dto);
  }
}

@Module({
  imports: [AiModule],
  controllers: [ConversationsController],
  providers: [ChatGateway, ConversationsService]
})
export class ChatModule {}
