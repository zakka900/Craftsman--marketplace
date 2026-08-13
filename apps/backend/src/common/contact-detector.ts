/**
 * Rileva tentativi di scambiarsi contatti esterni in chat prima dell'accettazione
 * di un preventivo (anti-circumvention del marketplace). Regex + check di stato
 * invece di NLP: scelta deliberata, più prevedibile e verificabile per un MVP.
 */
export interface ContactDetectionResult {
  blocked: boolean;
  reasons: string[];
}

const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const WHATSAPP_RE = /(wa\.me\/|whatsapp\.com|\bwhatsapp\b)/gi;
const TELEGRAM_RE = /(t\.me\/|telegram\.(me|org)|\btelegram\b)/gi;
const INSTAGRAM_RE = /(instagram\.com|\binsta(gram)?\b\s*[:@]?\s*\w+)/gi;
const URL_RE = /\b((https?:\/\/)|www\.)[^\s]+/gi;

const CHECKS: Array<{ reason: string; re: RegExp }> = [
  { reason: 'phone', re: PHONE_RE },
  { reason: 'email', re: EMAIL_RE },
  { reason: 'whatsapp', re: WHATSAPP_RE },
  { reason: 'telegram', re: TELEGRAM_RE },
  { reason: 'instagram', re: INSTAGRAM_RE },
  { reason: 'url', re: URL_RE }
];

export function detectContactInfo(text: string): ContactDetectionResult {
  const reasons: string[] = [];
  for (const { reason, re } of CHECKS) {
    re.lastIndex = 0;
    if (re.test(text)) reasons.push(reason);
  }
  return { blocked: reasons.length > 0, reasons };
}
