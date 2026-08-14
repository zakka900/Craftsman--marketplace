/**
 * QUOTES: list per request, submission (artisan side — TODO artisan app auth),
 * "Recommended" badge (score = rating*2 - (price/maxPrice)*3).
 */
import {
  Body, Controller, ForbiddenException, Get, Injectable, Module, NotFoundException,
  Param, Post, UseGuards
} from '@nestjs/common';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { buildTransitionOps } from '../common/job-state-machine';

export class SubmitQuoteDto {
  @IsString() @IsNotEmpty() requestId!: string;
  @IsString() @IsNotEmpty() artisanId!: string;
  @IsInt() @Min(1) price!: number;
  @IsInt() @Min(0) laborCost!: number;
  @IsInt() @Min(0) materials!: number;
  @IsInt() @Min(1) days!: number;
  @IsOptional() @IsString() note?: string;
}

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async listByRequest(userId: string, requestId: string) {
    const req = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('REQUEST_NOT_FOUND');
    if (req.clientId !== userId) throw new ForbiddenException('NOT_YOUR_REQUEST');
    return this.prisma.quote.findMany({
      where: { requestId }, include: { artisan: true }, orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Quote submission — called from the ARTISANS app (in development).
   * TODO: once the artisan app exists, protect with an artisan JWT.
   */
  async submit(dto: SubmitQuoteDto) {
    const req = await this.prisma.request.findUnique({ where: { id: dto.requestId } });
    if (!req) throw new NotFoundException('REQUEST_NOT_FOUND');
    const quote = await this.prisma.quote.create({
      data: {
        requestId: dto.requestId, artisanId: dto.artisanId, price: dto.price,
        laborCost: dto.laborCost, materials: dto.materials, days: dto.days, note: dto.note
      },
      include: { artisan: true }
    });
    await this.prisma.$transaction([
      ...buildTransitionOps(
        this.prisma, dto.requestId, req.status, 'QUOTES_RECEIVED',
        `New quote from ${quote.artisan.name}`, 'quote'
      ),
      this.prisma.notification.create({
        data: {
          userId: req.clientId, type: 'QUOTE', title: 'New quote received',
          body: `${quote.artisan.name} sent you a quote`, requestId: dto.requestId
        }
      })
    ]);
    await this.markRecommended(dto.requestId);
    return quote;
  }

  /** Recalculates the `recommended` flag among the quotes for a request. */
  async markRecommended(requestId: string) {
    const quotes = await this.prisma.quote.findMany({ where: { requestId }, include: { artisan: true } });
    if (quotes.length === 0) return;
    const maxPrice = Math.max(...quotes.map((q) => q.price));
    const best = quotes.reduce((a, b) =>
      (a.artisan.rating * 2 - (a.price / maxPrice) * 3) >= (b.artisan.rating * 2 - (b.price / maxPrice) * 3) ? a : b
    );
    await this.prisma.$transaction([
      this.prisma.quote.updateMany({ where: { requestId }, data: { recommended: false } }),
      this.prisma.quote.update({ where: { id: best.id }, data: { recommended: true } })
    ]);
  }
}

@Controller('quotes')
export class QuotesController {
  constructor(private service: QuotesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('request/:requestId')
  list(@CurrentUser() userId: string, @Param('requestId') id: string) {
    return this.service.listByRequest(userId, id);
  }

  // Artisan-side endpoint (TODO: dedicated artisan app auth)
  @Post() submit(@Body() dto: SubmitQuoteDto) { return this.service.submit(dto); }
}

@Module({ controllers: [QuotesController], providers: [QuotesService] })
export class QuotesModule {}
