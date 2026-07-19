/**
 * EMAIL transazionali (codici OTP di verifica e reset password).
 * Priorità: 1) Resend API HTTP (RESEND_API_KEY) — consigliato, funziona anche dove
 * le porte SMTP sono bloccate (es. Railway trial). 2) SMTP generico (SMTP_HOST/PORT/USER/PASS).
 * 3) Nessuno configurato (sviluppo locale) → il codice viene loggato in console.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private resendKey: string | null = null;

  constructor(private config: ConfigService) {
    this.resendKey = this.config.get<string>('RESEND_API_KEY') ?? null;
    const host = this.config.get<string>('SMTP_HOST');
    if (!this.resendKey && host) {
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

    const from = this.config.get<string>('MAIL_FROM') ?? 'Artisan <onboarding@resend.dev>';

    if (this.resendKey) {
      // Resend API HTTP (porta 443, mai bloccata)
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from, to, subject, html })
      });
      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Resend API ${res.status}: ${err}`);
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
