/**
 * PAYMENTS (escrow) — the controller talks ONLY to the PaymentService abstraction:
 * it doesn't know (and shouldn't know) that Stripe is underneath.
 *
 * Flow: POST /payments/deposit → clientSecret → the app confirms with the Stripe SDK
 * → a signed webhook updates the status (HELD_ESCROW) → on work confirmation
 * POST /payments/release → RELEASED (artisan payout via Stripe Connect, on the roadmap).
 */
import {
  BadRequestException, Body, Controller, ForbiddenException, Headers, HttpCode,
  Injectable, NotFoundException, Param, Post, RawBodyRequest, Req, UseGuards
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { IsNotEmpty, IsString } from 'class-validator';
import { PrismaService } from '../../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../../common/jwt-auth.guard';
import { PaymentService } from './payment-service.interface';

export class DepositDto {
  @IsString() @IsNotEmpty() contractId!: string;
}

/** Payment limit for accounts without bank verification (major units). */
const UNVERIFIED_LIMIT: Record<string, number> = { AED: 1000, SAR: 1000, QAR: 1000, KWD: 80 };

@Injectable()
export class PaymentsFlowService {
  constructor(private prisma: PrismaService, private payments: PaymentService) {}

  /** Creates (or resumes) the escrow deposit for a signed contract. */
  async deposit(userId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId }, include: { client: true, payment: true }
    });
    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (contract.clientId !== userId) throw new ForbiddenException('NOT_YOUR_CONTRACT');
    if (!contract.signedAt) throw new BadRequestException('CONTRACT_NOT_SIGNED');
    if (contract.payment && contract.payment.status !== 'PENDING' && contract.payment.status !== 'FAILED')
      throw new BadRequestException('ALREADY_PAID');

    const limit = UNVERIFIED_LIMIT[contract.currency] ?? 1000;
    if (!contract.client.bankVerified && contract.price > limit)
      throw new ForbiddenException('BANK_VERIFICATION_REQUIRED');

    // Local record first, PaymentIntent second: the webhook reconciles via providerId
    const payment = contract.payment
      ? await this.prisma.payment.update({ where: { id: contract.payment.id }, data: { status: 'PENDING' } })
      : await this.prisma.payment.create({
          data: {
            contractId, clientId: userId, amount: contract.price,
            currency: contract.currency, method: 'card', status: 'PENDING'
          }
        });

    const intent = await this.payments.createPaymentIntent(contract.price, contract.currency, {
      contractId, paymentId: payment.id, requestId: contract.requestId
    });
    await this.prisma.payment.update({ where: { id: payment.id }, data: { providerId: intent.id } });

    return {
      paymentId: payment.id, clientSecret: intent.clientSecret,
      amount: contract.price, currency: contract.currency
    };
  }

  /** Releases the escrow to the artisan after client confirmation. */
  async release(userId: string, contractId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { contractId } });
    if (!payment) throw new NotFoundException('PAYMENT_NOT_FOUND');
    if (payment.clientId !== userId) throw new ForbiddenException('NOT_YOUR_PAYMENT');
    if (payment.status !== 'HELD_ESCROW') throw new BadRequestException('NOT_IN_ESCROW');
    // REAL PROVIDER (phase 2): Stripe Connect → transfer to the artisan's account
    return this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'RELEASED' } });
  }

  /** Refund (e.g. dispute resolved in favor of the client). The REFUNDED status arrives via the webhook. */
  async refund(userId: string, contractId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { contractId } });
    if (!payment?.providerId) throw new NotFoundException('PAYMENT_NOT_FOUND');
    if (payment.clientId !== userId) throw new ForbiddenException('NOT_YOUR_PAYMENT');
    if (payment.status !== 'HELD_ESCROW') throw new BadRequestException('NOT_REFUNDABLE');
    const { refundId } = await this.payments.refundPayment(payment.providerId);
    return this.prisma.payment.update({ where: { id: payment.id }, data: { refundId } });
  }
}

@Controller('payments')
export class PaymentsController {
  constructor(private flow: PaymentsFlowService, private payments: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  deposit(@CurrentUser() userId: string, @Body() dto: DepositDto) {
    return this.flow.deposit(userId, dto.contractId);
  }

  /**
   * Stripe webhook — a PUBLIC endpoint but protected by the digital signature:
   * the RAW body (main.ts: rawBody true) is verified against STRIPE_WEBHOOK_SECRET.
   */
  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') signature: string
  ) {
    if (!req.rawBody || !signature) throw new BadRequestException('MISSING_SIGNATURE');
    return this.payments.handleWebhook(req.rawBody, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Post('release/:contractId')
  release(@CurrentUser() userId: string, @Param('contractId') id: string) {
    return this.flow.release(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refund/:contractId')
  refund(@CurrentUser() userId: string, @Param('contractId') id: string) {
    return this.flow.refund(userId, id);
  }
}
