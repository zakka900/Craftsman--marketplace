import { detectContactInfo } from './contact-detector';

describe('detectContactInfo', () => {
  it('lets ordinary conversation through', () => {
    const cases = [
      'Hi, when can you come check the leak?',
      'The bathroom is on the second floor.',
      'Thanks, see you then!',
      'It started leaking about 3 days ago.'
    ];
    for (const text of cases) {
      expect(detectContactInfo(text)).toEqual({ blocked: false, reasons: [] });
    }
  });

  it('flags phone numbers', () => {
    const result = detectContactInfo('Call me at +971 50 123 4567 please');
    expect(result.blocked).toBe(true);
    expect(result.reasons).toContain('phone');
  });

  it('flags email addresses', () => {
    const result = detectContactInfo('reach me at ahmed.plumber@example.com');
    expect(result.blocked).toBe(true);
    expect(result.reasons).toContain('email');
  });

  it('flags WhatsApp mentions and links', () => {
    expect(detectContactInfo('message me on whatsapp').reasons).toContain('whatsapp');
    expect(detectContactInfo('wa.me/971501234567').reasons).toContain('whatsapp');
  });

  it('flags Telegram mentions and links', () => {
    expect(detectContactInfo('find me on telegram').reasons).toContain('telegram');
    expect(detectContactInfo('t.me/ahmedplumber').reasons).toContain('telegram');
  });

  it('flags Instagram handles', () => {
    expect(detectContactInfo('follow instagram.com/ahmedfixes').reasons).toContain('instagram');
  });

  it('flags generic URLs', () => {
    expect(detectContactInfo('check https://mysite.com for photos').reasons).toContain('url');
  });

  it('flags multiple categories in the same message', () => {
    const result = detectContactInfo('Call +971501234567 or email me@test.com');
    expect(result.blocked).toBe(true);
    expect(result.reasons).toEqual(expect.arrayContaining(['phone', 'email']));
  });
});
