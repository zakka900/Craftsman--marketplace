/**
 * TRANSLATION of user content (not the UI, which is already handled by i18n on mobile).
 * Cache keyed by (text hash, target language): the same text requested twice
 * doesn't call the AI again. The original text is never overwritten: the cache is
 * a separate entity (Translation), queryable but never the source of truth.
 */
import { Body, Controller, Injectable, Module, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AiModule } from '../ai/ai.module';
import { AiService } from '../ai/ai.service';

export class TranslateDto {
  @IsString() @IsNotEmpty() @MaxLength(4000) text!: string;
  @IsIn(['en', 'ar']) targetLang!: 'en' | 'ar';
}

const sha256 = (s: string) => createHash('sha256').update(s.trim()).digest('hex');

@Injectable()
export class TranslationService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async translate(text: string, targetLang: string) {
    const sourceHash = sha256(text);
    const cached = await this.prisma.translation.findUnique({
      where: { sourceHash_targetLang: { sourceHash, targetLang } }
    });
    if (cached) {
      return { translatedText: cached.translatedText, sourceLang: cached.sourceLang, cached: true };
    }

    const result = await this.ai.translate(text, targetLang);
    // If the text is already in the target language (or the AI can't determine it), don't cache noise
    if (result.translatedText.trim() === text.trim()) {
      return { translatedText: result.translatedText, sourceLang: result.sourceLang, cached: false };
    }
    await this.prisma.translation.create({
      data: { sourceHash, targetLang, sourceLang: result.sourceLang, sourceText: text, translatedText: result.translatedText }
    });
    return { translatedText: result.translatedText, sourceLang: result.sourceLang, cached: false };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('translate')
export class TranslationController {
  constructor(private service: TranslationService) {}

  @Post() translate(@Body() dto: TranslateDto) {
    return this.service.translate(dto.text, dto.targetLang);
  }
}

@Module({
  imports: [AiModule],
  controllers: [TranslationController],
  providers: [TranslationService]
})
export class TranslationModule {}
