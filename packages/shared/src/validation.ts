export type PasswordRuleKey = 'minLength' | 'upper' | 'lower' | 'number' | 'special';

export interface PasswordRuleResult {
  key: PasswordRuleKey;
  ok: boolean;
}

export function checkPasswordRules(pw: string): PasswordRuleResult[] {
  return [
    { key: 'minLength', ok: pw.length >= 8 },
    { key: 'upper', ok: /[A-Z]/.test(pw) },
    { key: 'lower', ok: /[a-z]/.test(pw) },
    { key: 'number', ok: /[0-9]/.test(pw) },
    { key: 'special', ok: /[^A-Za-z0-9]/.test(pw) }
  ];
}

/** 0..1 */
export function passwordStrength(pw: string): number {
  if (!pw) return 0;
  const rules = checkPasswordRules(pw);
  const passed = rules.filter(r => r.ok).length;
  const lengthBonus = Math.min(pw.length / 16, 1) * 0.2;
  return Math.min(passed / rules.length * 0.8 + lengthBonus, 1);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return /^[0-9]{7,10}$/.test(phone.replace(/\s/g, ''));
}
