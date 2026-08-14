/** Picks the provider (Gemini if GEMINI_API_KEY is set, otherwise mock) and never lets
 * an AI error break the flow: on Gemini failure, it silently falls back to the mock. */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProvider, AnalyzeRequestInput, AnalyzeRequestResult, ArtisanReplyInput,
  SuggestQuoteInput, SuggestQuoteResult, TranslateResult
} from './ai-provider.interface';
import { MockAiProvider } from './mock-ai.provider';
import { GeminiAiProvider } from './gemini-ai.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly real: AiProvider | null;

  constructor(private config: ConfigService, private mock: MockAiProvider) {
    this.real = this.config.get<string>('GEMINI_API_KEY') ? new GeminiAiProvider(this.config) : null;
    if (!this.real) this.logger.warn('GEMINI_API_KEY not set: using the mock AI provider');
  }

  private async withFallback<T>(call: (p: AiProvider) => Promise<T>): Promise<T> {
    if (this.real) {
      try {
        return await call(this.real);
      } catch (err) {
        this.logger.error(`Gemini call failed, using the mock fallback: ${err}`);
      }
    }
    return call(this.mock);
  }

  analyzeRequest(input: AnalyzeRequestInput): Promise<AnalyzeRequestResult> {
    return this.withFallback((p) => p.analyzeRequest(input));
  }

  suggestQuote(input: SuggestQuoteInput): Promise<SuggestQuoteResult> {
    return this.withFallback((p) => p.suggestQuote(input));
  }

  translate(text: string, targetLang: string): Promise<TranslateResult> {
    return this.withFallback((p) => p.translate(text, targetLang));
  }

  replyAsArtisan(input: ArtisanReplyInput): Promise<string> {
    return this.withFallback((p) => p.replyAsArtisan(input));
  }
}
