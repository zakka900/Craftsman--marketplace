/**
 * ASTRAZIONE PAGAMENTI — il resto del backend dipende SOLO da questa interfaccia.
 * Implementazione attuale: StripeService (UAE). Per aggiungere in futuro un altro
 * provider (es. Tap Payments per KSA/mada) basta una nuova classe che la implementa
 * e cambiare il binding nel PaymentsModule: nessun'altra riga di codice cambia.
 *
 * Usata come classe astratta (non `interface`) perché serve anche da token
 * di dependency-injection per NestJS.
 */

export interface PaymentIntentResult {
  /** id del PaymentIntent (Stripe: pi_...) */
  id: string;
  /** client_secret da passare all'app mobile per confermare il pagamento */
  clientSecret: string;
}

export abstract class PaymentService {
  /**
   * Crea un intento di pagamento.
   * @param amount   importo in unità MAGGIORI (es. 250.50 AED) — la conversione
   *                 in unità minori (fils/cents) è responsabilità del provider
   * @param currency codice ISO ('aed', 'sar', ...)
   * @param metadata chiavi utili a riconciliare il webhook (contractId, paymentId)
   */
  abstract createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntentResult>;

  /**
   * Gestisce una notifica webhook del provider.
   * DEVE validare la firma digitale: se non valida, lancia BadRequestException.
   * @param rawBody   corpo RAW della richiesta (non parsato: serve per la firma)
   * @param signature header di firma (Stripe: 'stripe-signature')
   */
  abstract handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }>;

  /** Rimborso totale di un pagamento. @param id id del PaymentIntent */
  abstract refundPayment(id: string): Promise<{ refundId: string }>;
}
