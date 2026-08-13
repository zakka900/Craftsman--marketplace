/**
 * RICHIESTE: creazione dal wizard 4 step, lista per tab, dettaglio con timeline,
 * conferma completamento (rilascio escrow), disputa, recensione.
 * Tutte le rotte sono protette: il clientId arriva dal JWT, mai dal body.
 */
import {
  BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, Module,
  NotFoundException, Param, Post, Query, UseGuards
} from '@nestjs/common';
import {
  ArrayMaxSize, IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min
} from 'class-validator';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { assertTransition, buildTransitionOps } from '../common/job-state-machine';

export class CreateRequestDto {
  @IsString() @IsNotEmpty() categoryId!: string;
  @IsString() @IsNotEmpty() subcategory!: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) description!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(6) photos?: string[];
  @IsString() @IsNotEmpty() city!: string;
  @IsIn(['APARTMENT', 'VILLA', 'OFFICE', 'SHOP']) propertyType!: string;
  @IsIn(['NOW', 'WEEK', 'FLEXIBLE']) urgency!: string;
  @IsOptional() @IsInt() @Min(0) budgetMin?: number;
  @IsOptional() @IsInt() @Min(0) budgetMax?: number;
  @IsOptional() @IsString() directArtisanId?: string;
}

export class DisputeDto {
  @IsString() @IsNotEmpty() reason!: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) description!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(6) photos?: string[];
}

export class ReviewDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsInt() @Min(1) @Max(5) quality!: number;
  @IsInt() @Min(1) @Max(5) punctuality!: number;
  @IsInt() @Min(1) @Max(5) cleanliness!: number;
  @IsInt() @Min(1) @Max(5) communication!: number;
  @IsOptional() @IsString() @MaxLength(1000) text?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(6) photos?: string[];
  recommend!: boolean;
}

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  /** Ritorna la richiesta SOLO se appartiene all'utente. */
  private async own(userId: string, id: string) {
    const req = await this.prisma.request.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('REQUEST_NOT_FOUND');
    if (req.clientId !== userId) throw new ForbiddenException('NOT_YOUR_REQUEST');
    return req;
  }

  create(clientId: string, dto: CreateRequestDto) {
    return this.prisma.request.create({
      data: {
        clientId, categoryId: dto.categoryId, subcategory: dto.subcategory,
        description: dto.description, photos: dto.photos ?? [], city: dto.city,
        propertyType: dto.propertyType as any, urgency: dto.urgency as any,
        budgetMin: dto.budgetMin, budgetMax: dto.budgetMax,
        directArtisanId: dto.directArtisanId,
        events: { create: { type: 'created', text: 'Request published' } }
      }
    });
  }

  list(clientId: string, tab?: string) {
    const statusFilter =
      tab === 'completed' ? { status: 'COMPLETED' as const } :
      tab === 'cancelled' ? { status: 'CANCELLED' as const } :
      tab === 'disputed' ? { status: 'DISPUTED' as const } :
      { status: { notIn: ['COMPLETED', 'CANCELLED', 'DISPUTED'] as any } };
    return this.prisma.request.findMany({
      where: { clientId, ...statusFilter },
      include: { quotes: { include: { artisan: true } }, contract: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(userId: string, id: string) {
    await this.own(userId, id);
    return this.prisma.request.findUnique({
      where: { id },
      include: {
        quotes: { include: { artisan: true } },
        infoRequests: { include: { artisan: true } },
        contract: { include: { artisan: true, payment: true } },
        jobUpdates: { orderBy: { createdAt: 'asc' } },
        events: { orderBy: { createdAt: 'asc' } },
        dispute: true, review: true
      }
    });
  }

  async cancel(userId: string, id: string) {
    const req = await this.own(userId, id);
    assertTransition(req.status, 'CANCELLED');
    await this.prisma.$transaction(
      buildTransitionOps(this.prisma, id, req.status, 'CANCELLED', 'Request cancelled by client')
    );
    return this.getById(userId, id);
  }

  /** Conferma completamento: stato COMPLETED + rilascio del pagamento in escrow. */
  async confirmCompletion(userId: string, id: string) {
    const req = await this.own(userId, id);
    assertTransition(req.status, 'COMPLETED');

    const contract = await this.prisma.contract.findUnique({ where: { requestId: id }, include: { payment: true } });
    const ops: any[] = [
      this.prisma.request.update({ where: { id }, data: { status: 'COMPLETED', stage: 'CLIENT_CONFIRMED' } }),
      this.prisma.requestEvent.create({ data: { requestId: id, type: 'stage', text: 'Client confirmed completion' } })
    ];
    if (contract?.payment?.status === 'HELD_ESCROW') {
      // PROVIDER REALE (fase 2): Stripe Connect transfer all'artigiano
      ops.push(this.prisma.payment.update({ where: { id: contract.payment.id }, data: { status: 'RELEASED' } }));
    }
    await this.prisma.$transaction(ops);
    return this.getById(userId, id);
  }

  async openDispute(userId: string, id: string, dto: DisputeDto) {
    const req = await this.own(userId, id);
    assertTransition(req.status, 'DISPUTED');
    await this.prisma.$transaction([
      this.prisma.dispute.create({
        data: { requestId: id, clientId: userId, reason: dto.reason, description: dto.description, photos: dto.photos ?? [] }
      }),
      ...buildTransitionOps(this.prisma, id, req.status, 'DISPUTED', `Dispute opened: ${dto.reason}`, 'dispute')
    ]);
    return { ok: true };
  }

  async submitReview(userId: string, id: string, dto: ReviewDto) {
    const req = await this.own(userId, id);
    if (req.status !== 'COMPLETED') throw new BadRequestException('NOT_COMPLETED');
    const contract = await this.prisma.contract.findUnique({ where: { requestId: id } });
    if (!contract) throw new BadRequestException('NO_CONTRACT');

    const review = await this.prisma.review.create({
      data: {
        requestId: id, clientId: userId, artisanId: contract.artisanId,
        rating: dto.rating, quality: dto.quality, punctuality: dto.punctuality,
        cleanliness: dto.cleanliness, communication: dto.communication,
        text: dto.text, photos: dto.photos ?? [], recommend: dto.recommend
      }
    });
    // Ricalcolo aggregato rating artigiano
    const agg = await this.prisma.review.aggregate({
      where: { artisanId: contract.artisanId }, _avg: { rating: true }, _count: true
    });
    await this.prisma.artisan.update({
      where: { id: contract.artisanId },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, jobsDone: { increment: 1 } }
    });
    return review;
  }
}

@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private service: RequestsService) {}

  @Post() create(@CurrentUser() userId: string, @Body() dto: CreateRequestDto) {
    return this.service.create(userId, dto);
  }
  @Get() list(@CurrentUser() userId: string, @Query('tab') tab?: string) {
    return this.service.list(userId, tab);
  }
  @Get(':id') get(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.getById(userId, id);
  }
  @Post(':id/cancel') cancel(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.cancel(userId, id);
  }
  @Post(':id/confirm') confirm(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.confirmCompletion(userId, id);
  }
  @Post(':id/dispute') dispute(@CurrentUser() userId: string, @Param('id') id: string, @Body() dto: DisputeDto) {
    return this.service.openDispute(userId, id, dto);
  }
  @Post(':id/review') review(@CurrentUser() userId: string, @Param('id') id: string, @Body() dto: ReviewDto) {
    return this.service.submitReview(userId, id, dto);
  }
}

@Module({ controllers: [RequestsController], providers: [RequestsService] })
export class RequestsModule {}
