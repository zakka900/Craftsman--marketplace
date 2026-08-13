/**
 * Provider AI mock — deterministico, nessuna chiamata esterna. Usato quando
 * GEMINI_API_KEY non è configurata, e come fallback se la chiamata a Gemini fallisce
 * (i suggerimenti AI sono un aiuto non bloccante, non devono mai rompere il flusso).
 */
import { Injectable } from '@nestjs/common';
import {
  AiProvider, AnalyzeRequestInput, AnalyzeRequestResult, ArtisanReplyInput,
  SuggestQuoteInput, SuggestQuoteResult, TranslateResult
} from './ai-provider.interface';

const TEXT_HINTS: Record<string, string[]> = {
  plumber: [
    'Specify if the leak is visible or hidden behind a wall',
    'Say how long the problem has been happening',
    'Mention if you can shut off the main water valve'
  ],
  electrician: [
    'Specify which rooms or circuits are affected',
    'Mention if the breaker trips and how often',
    'Add the approximate age of the electrical system'
  ],
  renovation: [
    'Add approximate square meters of the area',
    'Specify if you already have materials or need supply',
    'Mention your preferred start date'
  ],
  hvac: [
    'Specify AC brand and unit type (split/central)',
    'Mention if the unit cools weakly or not at all'
  ],
  painter: [
    'Add number of rooms and approximate wall area',
    'Specify if walls need repair before painting'
  ],
  default: [
    'Add measurements or dimensions if relevant',
    'Specify preferred timing for the work',
    'Mention building/floor access details'
  ]
};

const QUOTE_CHECKLIST: Record<string, string[]> = {
  plumber: ['Specify parts/materials included (pipes, fittings)', 'State the warranty period on labor'],
  electrician: ['List materials included (cabling, breakers)', 'Mention compliance with local safety code'],
  renovation: ['Break down labor vs materials cost', 'Specify estimated completion date'],
  default: ['Break down labor vs materials cost', 'State the warranty period on the work']
};

const DISCLAIMER =
  'AI-generated suggestion — not a final price. The professional sets and confirms the actual quote.';

@Injectable()
export class MockAiProvider extends AiProvider {
  async analyzeRequest({ categoryId, description }: AnalyzeRequestInput): Promise<AnalyzeRequestResult> {
    const hints = TEXT_HINTS[categoryId] || TEXT_HINTS.default;
    const missingInfo = hints.filter((h) => {
      const kw = h.split(' ').filter((w) => w.length > 5).slice(0, 2);
      return !kw.some((w) => description.toLowerCase().includes(w.toLowerCase()));
    }).slice(0, 3);
    return { missingInfo, questions: missingInfo };
  }

  async suggestQuote(input: SuggestQuoteInput): Promise<SuggestQuoteResult> {
    const suggestions = QUOTE_CHECKLIST[input.categoryId] || QUOTE_CHECKLIST.default;
    const missingInfo: string[] = [];
    if (input.description.trim().length < 30) missingInfo.push('Description is quite short — ask the client for more detail');
    if (!input.budgetMin && !input.budgetMax) missingInfo.push('Client did not specify a budget range');

    const priceRangeHint =
      input.budgetMin != null && input.budgetMax != null ? { min: input.budgetMin, max: input.budgetMax } : null;

    return { suggestions, missingInfo, priceRangeHint, disclaimer: DISCLAIMER };
  }

  async translate(text: string): Promise<TranslateResult> {
    // Nessuna traduzione reale disponibile senza GEMINI_API_KEY: passthrough esplicito.
    return { translatedText: text, sourceLang: 'unknown' };
  }

  async replyAsArtisan(_input: ArtisanReplyInput): Promise<string> {
    const templates = [
      "Thanks for the message! Could you share a bit more detail?",
      "Sure, I can help with that. What time works best for you?",
      "Got it — let me check my schedule and I'll confirm shortly.",
      "No problem, jobs like this usually take a day or two.",
      "Sounds good, send me the exact address when you're ready."
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}
