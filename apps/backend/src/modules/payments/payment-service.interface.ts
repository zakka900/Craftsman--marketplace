/**
 * PAYMENTS ABSTRACTION — the rest of the backend depends ONLY on this interface.
 * Current implementation: StripeService (UAE). To add another provider in the
 * future (e.g. Tap Payments for KSA/mada), just add a new class implementing it
 * and change the binding in PaymentsModule: no other line of code changes.
 *
 * Used as an abstract class (not an `interface`) because it also acts as the
 * dependency-injection token for NestJS.
 */

export interface PaymentIntentResult {
  /** PaymentIntent id (Stripe: pi_...) */
  id: string;
  /** client_secret to pass to the mobile app to confirm the payment */
  clientSecret: string;
}

export abstract class PaymentService {
  /**
   * Creates a payment intent.
   * @param amount   amount in MAJOR units (e.g. 250.50 AED) — converting to
   *                 minor units (fils/cents) is the provider's responsibility
   * @param currency ISO code ('aed', 'sar', ...)
   * @param metadata keys useful for reconciling the webhook (contractId, paymentId)
   */
  abstract createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntentResult>;

  /**
   * Handles a webhook notification from the provider.
   * MUST validate the digital signature: if invalid, throws BadRequestException.
   * @param rawBody   RAW request body (unparsed: needed for the signature)
   * @param signature signature header (Stripe: 'stripe-signature')
   */
  abstract handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }>;

  /** Full refund of a payment. @param id the PaymentIntent id */
  abstract refundPayment(id: string): Promise<{ refundId: string }>;
}
