/**
 * AI LAYER — due usi distinti nel flusso di prodotto (non un chatbot generico):
 * 1) lato cliente, in fase di creazione richiesta: rileva info mancanti (endpoint
 *    già anticipato da un commento in mobile/mockData.ts: /ai/analyze-text);
 * 2) lato professionista, prima di inviare un preventivo: suggerisce cosa includere.
 *    Endpoint aperto come gli altri endpoint "lato artigiano" già presenti
 *    (quotes.module.ts, info-requests.module.ts) — nessuna app/auth artigiani in questa fase.
 */
import { Body, Controller, Module, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AiService } from './ai.service';
import { MockAiProvider } from './mock-ai.provider';

export class AnalyzeTextDto {
  @IsString() @IsNotEmpty() categoryId!: string;
  @IsString() @MaxLength(2000) description!: string;
}

export class SuggestQuoteDto {
  @IsString() @IsNotEmpty() requestId!: string;
}

@Controller('ai')
export class AiController {
  constructor(private ai: AiService, private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('analyze-text')
  analyzeText(@Body() dto: AnalyzeTextDto) {
    return this.ai.analyzeRequest({ categoryId: dto.categoryId, description: dto.description ?? '' });
  }

  @Post('suggest-quote')
  async suggestQuote(@Body() dto: SuggestQuoteDto) {
    const req = await this.prisma.request.findUnique({ where: { id: dto.requestId } });
    if (!req) throw new NotFoundException('REQUEST_NOT_FOUND');
    return this.ai.suggestQuote({
      categoryId: req.categoryId, subcategory: req.subcategory, description: req.description,
      city: req.city, propertyType: req.propertyType, urgency: req.urgency,
      budgetMin: req.budgetMin, budgetMax: req.budgetMax
    });
  }
}

@Module({
  controllers: [AiController],
  providers: [AiService, MockAiProvider],
  exports: [AiService]
})
export class AiModule {}
