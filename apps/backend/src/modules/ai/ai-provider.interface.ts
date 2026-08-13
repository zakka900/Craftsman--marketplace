/**
 * ASTRAZIONE AI — stesso pattern di PaymentService: il resto del backend dipende
 * SOLO da questa interfaccia, mai da Gemini direttamente.
 *
 * Regola di prodotto (vale per ogni implementazione): l'AI non dichiara MAI un
 * prezzo come definitivo. `priceRangeHint` è solo un range indicativo e
 * `disclaimer` è sempre presente — il prezzo finale resta deciso dal professionista.
 */

export interface AnalyzeRequestInput {
  categoryId: string;
  description: string;
}

export interface AnalyzeRequestResult {
  /** Informazioni che mancano per completare la richiesta (dimensioni, tempistiche, materiali...) */
  missingInfo: string[];
  /** Domande di completamento da proporre al cliente */
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
  /** Cosa includere nel preventivo: materiali, tempi, garanzia, costi extra */
  suggestions: string[];
  /** Informazioni chiave mancanti nella richiesta */
  missingInfo: string[];
  /** Range indicativo, MAI un prezzo definitivo */
  priceRangeHint: { min: number; max: number } | null;
  /** Sempre presente: chiarisce che è un suggerimento, non un prezzo vincolante */
  disclaimer: string;
}

export interface TranslateResult {
  translatedText: string;
  sourceLang: string;
}

export interface ArtisanReplyInput {
  artisanName: string;
  categoryId: string;
  /** Ultimi messaggi della conversazione, dal più vecchio al più recente (esclude clientMessage). */
  history: { from: 'client' | 'artisan'; text: string }[];
  clientMessage: string;
}

export abstract class AiProvider {
  abstract analyzeRequest(input: AnalyzeRequestInput): Promise<AnalyzeRequestResult>;
  abstract suggestQuote(input: SuggestQuoteInput): Promise<SuggestQuoteResult>;
  abstract translate(text: string, targetLang: string): Promise<TranslateResult>;
  /** L'AI risponde IN VECE dell'artigiano (nessuna app artigiani reale) — resta in personaggio. */
  abstract replyAsArtisan(input: ArtisanReplyInput): Promise<string>;
}
