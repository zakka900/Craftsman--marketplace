/**
 * AI ABSTRACTION — same pattern as PaymentService: the rest of the backend depends
 * ONLY on this interface, never on Gemini directly.
 *
 * Product rule (applies to every implementation): the AI NEVER states a price as
 * final. `priceRangeHint` is only an indicative range and `disclaimer` is always
 * present — the final price is always decided by the professional.
 */

export interface AnalyzeRequestInput {
  categoryId: string;
  description: string;
}

export interface AnalyzeRequestResult {
  /** Information missing to complete the request (dimensions, timeline, materials...) */
  missingInfo: string[];
  /** Follow-up questions to propose to the client */
  questions: string[];
}

export interface SuggestQuoteInput {
  categoryId: string;
  subcategory: string;
  description: string;
  city: string;
  propertyType: string;
  urgency: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
}

export interface SuggestQuoteResult {
  /** What to include in the quote: materials, timeline, warranty, extra costs */
  suggestions: string[];
  /** Key information missing from the request */
  missingInfo: string[];
  /** Indicative range, NEVER a final price */
  priceRangeHint: { min: number; max: number } | null;
  /** Always present: clarifies that this is a suggestion, not a binding price */
  disclaimer: string;
}

export interface TranslateResult {
  translatedText: string;
  sourceLang: string;
}

export interface ArtisanReplyInput {
  artisanName: string;
  categoryId: string;
  /** Latest conversation messages, oldest to newest (excludes clientMessage). */
  history: { from: 'client' | 'artisan'; text: string }[];
  clientMessage: string;
}

export abstract class AiProvider {
  abstract analyzeRequest(input: AnalyzeRequestInput): Promise<AnalyzeRequestResult>;
  abstract suggestQuote(input: SuggestQuoteInput): Promise<SuggestQuoteResult>;
  abstract translate(text: string, targetLang: string): Promise<TranslateResult>;
  /** The AI replies ON BEHALF OF the artisan (no real artisan app yet) — stays in character. */
  abstract replyAsArtisan(input: ArtisanReplyInput): Promise<string>;
}
