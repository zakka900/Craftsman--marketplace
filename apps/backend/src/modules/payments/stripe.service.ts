/**
 * STRIPE — PaymentService implementation for the UAE.
 * - PaymentIntent with automatic_payment_methods (cards + Apple Pay / Google Pay)
 * - Webhooks validated with a digital signature (constructEvent + STRIPE_WEBHOOK_SECRET):
 *   any request not signed by Stripe is rejected with 400.
 * - Escrow: funds stay in the platform balance (status HELD_ESCROW in the DB);
 *   the transfer to the artisan will happen via Stripe Connect (transfer) — see release().
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma.service';
import { PaymentIntentResult, PaymentService } from './payment-service.interface';
import { assertTransition } from '../../common/job-state-machine';

/** Currencies with 3 decimals (Stripe treats them in thousandths). AED/SAR/QAR = 2 decimals. */
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
    // Keys ONLY from environment variables — never hardcoded
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
      automatic_payment_methods: { enabled: true } // cards, Apple Pay, Google Pay
    });
    return { id: intent.id, clientSecret: intent.client_secret! };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      // Cryptographic signature verification: guarantees the event comes from Stripe
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err: any) {
      this.logger.warn(`Webhook signature NOT valid: ${err.message}`);
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
        this.logger.debug(`Ignored event: ${event.type}`);
    }
    return { received: true };
  }

  async refundPayment(id: string) {
    const refund = await this.stripe.refunds.create({ payment_intent: id });
    return { refundId: refund.id };
  }

  // ---------------- event reactions ----------------

  private async onPaymentSucceeded(intent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerId: intent.id },
      include: { contract: { include: { request: true } } }
    });
    if (!payment) { this.logger.warn(`Payment not found for ${intent.id}`); return; }
    assertTransition(payment.contract.request.status, 'IN_PROGRESS');

    await this.prisma.$transaction([
      // Funds collected and held in escrow until client confirmation
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'HELD_ESCROW', receiptId: String(intent.latest_charge ?? '') || null }
      }),
      // Work begins: request IN_PROGRESS, stage CONFIRMED
      this.prisma.request.update({
        where: { id: payment.contract.requestId },
        data: { status: 'IN_PROGRESS', stage: 'CONFIRMED' }
      }),
      this.prisma.requestEvent.create({
        data: { requestId: payment.contract.requestId, type: 'stage', text: 'Deposit received — work confirmed' }
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
