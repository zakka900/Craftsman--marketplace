/** Sceglie il provider (Gemini se GEMINI_API_KEY è impostata, altrimenti mock) e non lascia
 * mai un errore AI rompere il flusso: su fallimento Gemini ricade silenziosamente sul mock. */
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
    if (!this.real) this.logger.warn('GEMINI_API_KEY non impostata: uso il provider AI mock');
  }

  private async withFallback<T>(call: (p: AiProvider) => Promise<T>): Promise<T> {
    if (this.real) {
      try {
        return await call(this.real);
      } catch (err) {
        this.logger.error(`Chiamata Gemini fallita, uso il fallback mock: ${err}`);
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
