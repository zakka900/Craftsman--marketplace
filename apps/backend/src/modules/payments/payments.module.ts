/**
 * Payment provider binding: PaymentService → StripeService.
 * To switch provider in the future (e.g. Tap for KSA), change ONLY this line.
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
