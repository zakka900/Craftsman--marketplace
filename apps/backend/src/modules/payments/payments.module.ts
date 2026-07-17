/**
 * Binding del provider pagamenti: PaymentService → StripeService.
 * Per cambiare provider in futuro (es. Tap per KSA) si cambia SOLO questa riga.
 */
import { Module } from '@nestjs/common';
import { PaymentService } from './payment-service.interface';
import { StripeService } from './stripe.service';
import { PaymentsController, PaymentsFlowService } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsFlowService,
    { provide: PaymentService, useClass: StripeService }
  ],
  exports: [PaymentService]
})
export class PaymentsModule {}
