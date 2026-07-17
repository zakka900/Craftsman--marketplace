/**
 * STRIPE — implementazione di PaymentService per gli UAE.
 * - PaymentIntent con automatic_payment_methods (carte + Apple Pay / Google Pay)
 * - Webhook validati con firma digitale (constructEvent + STRIPE_WEBHOOK_SECRET):
 *   qualsiasi richiesta non firmata da Stripe viene rifiutata con 400.
 * - Escrow: l'incasso resta sul saldo piattaforma (status HELD_ESCROW nel DB);
 *   il giro all'artigiano avverrà con Stripe Connect (transfer) — vedi release().
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma.service';
import { PaymentIntentResult, PaymentService } from './payment-service.interface';

/** Valute a 3 decimali (Stripe le tratta in millesimi). AED/SAR/QAR = 2 decimali. */
const THREE_DECIMALS = new Set(['kwd', 'bhd', 'omr']);
const toMinorUnits = (amount: number, currency: string) =>
  Math.round(amount * (THREE_DECIMALS.has(currency.toLowerCase()) ? 1000 : 100));

@Injectable()
export class StripeService extends PaymentService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private config: ConfigService, private prisma: PrismaService) {
    super();
    // Chiavi SOLO da variabili d'ambiente — mai hardcoded
    this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16'
    });
    this.webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: toMinorUnits(amount, currency),
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true } // carte, Apple Pay, Google Pay
    });
    return { id: intent.id, clientSecret: intent.client_secret! };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      // Verifica crittografica della firma: garantisce che l'evento arrivi da Stripe
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err: any) {
      this.logger.warn(`Firma webhook NON valida: ${err.message}`);
      throw new BadRequestException('INVALID_SIGNATURE');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.onPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.markStatus((event.data.object as Stripe.PaymentIntent).id, 'FAILED');
        break;
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) await this.markStatus(String(charge.payment_intent), 'REFUNDED');
        break;
      }
      default:
        this.logger.debug(`Evento ignorato: ${event.type}`);
    }
    return { received: true };
  }

  async refundPayment(id: string) {
    const refund = await this.stripe.refunds.create({ payment_intent: id });
    return { refundId: refund.id };
  }

  // ---------------- reazioni agli eventi ----------------

  private async onPaymentSucceeded(intent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerId: intent.id },
      include: { contract: true }
    });
    if (!payment) { this.logger.warn(`Payment non trovato per ${intent.id}`); return; }

    await this.prisma.$transaction([
      // Fondi incassati e trattenuti in escrow fino a conferma del cliente
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'HELD_ESCROW', receiptId: String(intent.latest_charge ?? '') || null }
      }),
      // Il lavoro parte: richiesta IN_PROGRESS, stage CONFIRMED
      this.prisma.request.update({
        where: { id: payment.contract.requestId },
        data: { status: 'IN_PROGRESS', stage: 'CONFIRMED' }
      }),
      this.prisma.notification.create({
        data: {
          userId: payment.clientId, type: 'JOB',
          title: 'Payment received',
          body: 'Your deposit is held in escrow. The artisan has been notified.',
          requestId: payment.contract.requestId
        }
      })
    ]);
  }

  private async markStatus(intentId: string, status: 'FAILED' | 'REFUNDED') {
    await this.prisma.payment.updateMany({ where: { providerId: intentId }, data: { status } });
  }
}
