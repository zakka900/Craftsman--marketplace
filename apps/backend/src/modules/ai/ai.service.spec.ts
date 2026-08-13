import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { MockAiProvider } from './mock-ai.provider';
import { GeminiAiProvider } from './gemini-ai.provider';

// Gemini fa una vera chiamata di rete: nei test viene sempre sostituito da un doppio controllato.
jest.mock('./gemini-ai.provider');

describe('AiService', () => {
  let mockProvider: MockAiProvider;

  function buildService(apiKey: string | undefined) {
    const config = {
      get: jest.fn((key: string) => (key === 'GEMINI_API_KEY' ? apiKey : undefined))
    } as unknown as ConfigService;
    return new AiService(config, mockProvider);
  }

  beforeEach(() => {
    mockProvider = new MockAiProvider();
    jest.clearAllMocks();
  });

  it('uses the mock provider directly when no GEMINI_API_KEY is configured', async () => {
    const spy = jest.spyOn(mockProvider, 'analyzeRequest');
    const service = buildService(undefined);

    await service.analyzeRequest({ categoryId: 'plumber', description: 'leak' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(GeminiAiProvider).not.toHaveBeenCalled();
  });

  it('falls back to the mock provider when Gemini fails, instead of throwing', async () => {
    (GeminiAiProvider as unknown as jest.Mock).mockImplementation(() => ({
      analyzeRequest: jest.fn().mockRejectedValue(new Error('network down'))
    }));
    const spy = jest.spyOn(mockProvider, 'analyzeRequest');
    const service = buildService('fake-key');

    const result = await service.analyzeRequest({ categoryId: 'plumber', description: 'leak' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });

  it('uses Gemini when it succeeds, without falling back to the mock', async () => {
    (GeminiAiProvider as unknown as jest.Mock).mockImplementation(() => ({
      analyzeRequest: jest.fn().mockResolvedValue({ missingInfo: ['dimensions'], questions: ['How big?'] })
    }));
    const spy = jest.spyOn(mockProvider, 'analyzeRequest');
    const service = buildService('fake-key');

    const result = await service.analyzeRequest({ categoryId: 'plumber', description: 'leak' });

    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual({ missingInfo: ['dimensions'], questions: ['How big?'] });
  });

  it('suggestQuote never returns model-authored text as the disclaimer (product rule)', async () => {
    const service = buildService(undefined);
    const result = await service.suggestQuote({
      categoryId: 'plumber', subcategory: 'leak', description: 'x', city: 'Riyadh',
      propertyType: 'APARTMENT', urgency: 'NOW', budgetMin: null, budgetMax: null
    });
    expect(result.disclaimer).toMatch(/not a final price/i);
  });
});
