/**
 * EMAIL transazionali (codici OTP di verifica e reset password).
 * Priorità: 1) Brevo API HTTP (BREVO_API_KEY) — consigliato, funziona anche dove
 * le porte SMTP sono bloccate (es. Railway trial). 2) SMTP generico (SMTP_HOST/PORT/USER/PASS).
 * 3) Nessuno configurato (sviluppo locale) → il codice viene loggato in console.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/** "Artisan <no-reply@artisan.app>" → { name: 'Artisan', email: 'no-reply@artisan.app' } (Brevo vuole i due campi separati). */
function parseFrom(from: string): { name?: string; email: string } {
  const match = from.match(/^(.*)<(.+)>$/);
  if (!match) return { email: from.trim() };
  return { name: match[1].trim() || undefined, email: match[2].trim() };
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private brevoKey: string | null = null;

  constructor(private config: ConfigService) {
    this.brevoKey = this.config.get<string>('BREVO_API_KEY') ?? null;
    const host = this.config.get<string>('SMTP_HOST');
    if (!this.brevoKey && host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') ?? 587),
        secure: Number(this.config.get('SMTP_PORT') ?? 587) === 465,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS')
        }
      });
    }
  }

  async sendOtp(to: string, code: string, purpose: 'verify' | 'reset') {
    const subject = purpose === 'verify' ? 'Your verification code' : 'Password reset code';
    const html = `
      <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:420px;margin:auto">
        <h2 style="color:#007AFF">Artisan</h2>
        <p>${purpose === 'verify' ? 'Use this code to verify your email:' : 'Use this code to reset your password:'}</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p>
        <p style="color:#8E8E93;font-size:13px">The code expires in 10 minutes. If you didn't request it, ignore this email.</p>
      </div>`;

    const from = this.config.get<string>('MAIL_FROM') ?? 'Artisan <no-reply@artisan.app>';

    if (this.brevoKey) {
      // Brevo API HTTP (porta 443, mai bloccata)
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ sender: parseFrom(from), to: [{ email: to }], subject, htmlContent: html })
      });
      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Brevo API ${res.status}: ${err}`);
        throw new Error(`Mail send failed (${res.status})`);
      }
      return;
    }

    if (!this.transporter) {
      // Sviluppo: nessun provider configurato → log in console
      this.logger.warn(`[DEV MAIL] ${purpose} → ${to}: codice ${code}`);
      return;
    }
    await this.transporter.sendMail({ from, to, subject, html });
  }
}
