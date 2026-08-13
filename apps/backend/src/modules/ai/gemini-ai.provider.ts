/**
 * PROVIDER REALE: Google Gemini (free tier) via REST — nessun SDK per restare leggeri.
 * https://aistudio.google.com/apikey
 *
 * Regola di prodotto imposta a livello di codice, non solo di prompt: il `disclaimer`
 * ritornato è SEMPRE la costante locale, mai il testo generato dal modello — così
 * anche se il modello "dimenticasse" l'istruzione, l'app non mostra mai un prezzo
 * come definitivo.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProvider, AnalyzeRequestInput, AnalyzeRequestResult, ArtisanReplyInput,
  SuggestQuoteInput, SuggestQuoteResult, TranslateResult
} from './ai-provider.interface';

const DISCLAIMER =
  'AI-generated suggestion — not a final price. The professional sets and confirms the actual quote.';

const LANG_NAMES: Record<string, string> = { en: 'English', ar: 'Arabic' };

@Injectable()
export class GeminiAiProvider extends AiProvider {
  private readonly logger = new Logger(GeminiAiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private config: ConfigService) {
    super();
    this.apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-flash-latest';
  }

  private async generateText(prompt: string, opts: { json?: boolean; temperature?: number } = {}): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.4,
          ...(opts.json ? { responseMimeType: 'application/json' } : {})
        }
      })
    });
    if (!res.ok) {
      throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini: empty response');
    return text;
  }

  private async generateJson(prompt: string): Promise<any> {
    return JSON.parse(await this.generateText(prompt, { json: true }));
  }

  async analyzeRequest({ categoryId, description }: AnalyzeRequestInput): Promise<AnalyzeRequestResult> {
    const prompt = `You are assisting a home-services marketplace. Given a customer's job request category and description, identify what important information is MISSING (e.g. dimensions, timeline, materials, access details) and propose short completion questions for the customer.
Category: ${categoryId}
Description: """${description}"""
Respond ONLY with compact JSON matching this schema, no markdown, no commentary:
{"missingInfo": string[], "questions": string[]}
Keep each item under 100 characters, max 4 items each. If the description already covers the essentials, return empty arrays.`;

    const json = await this.generateJson(prompt);
    return {
      missingInfo: Array.isArray(json.missingInfo) ? json.missingInfo.slice(0, 4) : [],
      questions: Array.isArray(json.questions) ? json.questions.slice(0, 4) : []
    };
  }

  async suggestQuote(input: SuggestQuoteInput): Promise<SuggestQuoteResult> {
    const prompt = `You are assisting a professional (artisan) preparing a price quote for a home-services job.
Given the job details below, suggest what the quote should include (materials, labor breakdown, warranty, extra costs) and flag any key information missing from the request.
CRITICAL RULE: NEVER state a definitive or exact price. You may suggest a rough indicative price RANGE only if the details reasonably allow it; otherwise return null for priceRangeHint. The professional always sets the final price.
Category: ${input.categoryId} / ${input.subcategory}
City: ${input.city}, Property: ${input.propertyType}, Urgency: ${input.urgency}
Client budget hint: ${input.budgetMin ?? 'n/a'}-${input.budgetMax ?? 'n/a'}
Description: """${input.description}"""
Respond ONLY with compact JSON, no markdown:
{"suggestions": string[], "missingInfo": string[], "priceRangeHint": {"min": number, "max": number} | null}
Max 5 suggestions, max 4 missingInfo items.`;

    const json = await this.generateJson(prompt);
    const range = json.priceRangeHint;
    const priceRangeHint =
      range && typeof range.min === 'number' && typeof range.max === 'number' ? { min: range.min, max: range.max } : null;

    return {
      suggestions: Array.isArray(json.suggestions) ? json.suggestions.slice(0, 5) : [],
      missingInfo: Array.isArray(json.missingInfo) ? json.missingInfo.slice(0, 4) : [],
      priceRangeHint,
      disclaimer: DISCLAIMER // mai il testo generato dal modello
    };
  }

  async translate(text: string, targetLang: string): Promise<TranslateResult> {
    const targetName = LANG_NAMES[targetLang] ?? targetLang;
    const prompt = `Translate the text below to ${targetName}. Also detect the source language as an ISO 639-1 code (e.g. "en", "ar").
Respond ONLY with compact JSON: {"translatedText": string, "sourceLang": string}
Text: """${text}"""`;

    const json = await this.generateJson(prompt);
    if (typeof json.translatedText !== 'string' || typeof json.sourceLang !== 'string') {
      throw new Error('Gemini: malformed translation response');
    }
    return { translatedText: json.translatedText, sourceLang: json.sourceLang };
  }

  async replyAsArtisan(input: ArtisanReplyInput): Promise<string> {
    const historyText = input.history
      .slice(-8)
      .map((h) => `${h.from === 'client' ? 'Client' : input.artisanName}: ${h.text}`)
      .join('\n');

    const prompt = `You are ${input.artisanName}, a real ${input.categoryId} tradesperson replying to a customer in the in-app chat of a home-services marketplace. Stay fully in character as a busy, friendly human professional texting from their phone: casual, brief (1-2 short sentences), natural texting style. Never mention being an AI, a model, or break character under any circumstance, even if asked directly.
${historyText ? `Conversation so far:\n${historyText}\n` : ''}Client: ${input.clientMessage}
Reply as ${input.artisanName} (plain text only, no quotes, no markdown):`;

    const text = await this.generateText(prompt, { temperature: 0.8 });
    return text.trim();
  }
}
