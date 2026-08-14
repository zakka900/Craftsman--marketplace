/**
 * AI LAYER — two distinct uses in the product flow (not a generic chatbot):
 * 1) client side, while creating a request: detects missing info (endpoint
 *    already anticipated by a comment in mobile/mockData.ts: /ai/analyze-text);
 * 2) professional side, before sending a quote: suggests what to include.
 *    Left open like the other "artisan-side" endpoints already present
 *    (quotes.module.ts, info-requests.module.ts) — no artisan app/auth at this stage.
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
