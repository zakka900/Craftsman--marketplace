/**
 * ADMIN: risoluzione dispute. Unico endpoint che dimostra RBAC end-to-end
 * (@Roles('ADMIN')) oltre al controllo di ownership già usato altrove.
 * Nessuna auto-registrazione: gli account ADMIN si creano solo via seed
 * (prisma/seed-admin.ts), mai da un endpoint pubblico.
 */
import {
  BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException,
  Param, Post, UseGuards
} from '@nestjs/common';
import { IsIn } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/roles.guard';
import { assertTransition, buildTransitionOps } from '../common/job-state-machine';
import { PaymentsModule } from './payments/payments.module';
import { PaymentService } from './payments/payment-service.interface';

export class ResolveDisputeDto {
  @IsIn(['CLIENT', 'ARTISAN']) resolution!: 'CLIENT' | 'ARTISAN';
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private payments: PaymentService) {}

  listDisputes() {
    return this.prisma.dispute.findMany({
      where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      include: { client: true, request: { include: { contract: { include: { artisan: true, payment: true } } } } },
      orderBy: { createdAt: 'asc' }
    });
  }

  async resolveDispute(disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { request: { include: { contract: { include: { payment: true } } } } }
    });
    if (!dispute) throw new NotFoundException('DISPUTE_NOT_FOUND');
    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('DISPUTE_ALREADY_RESOLVED');
    }

    const targetRequestStatus = dto.resolution === 'CLIENT' ? 'CANCELLED' : 'COMPLETED';
    assertTransition(dispute.request.status, targetRequestStatus);

    const payment = dispute.request.contract?.payment;
    if (payment?.status === 'HELD_ESCROW') {
      if (dto.resolution === 'CLIENT' && payment.providerId) {
        const { refundId } = await this.payments.refundPayment(payment.providerId);
        await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED', refundId } });
      } else if (dto.resolution === 'ARTISAN') {
        // PROVIDER REALE (fase 2): Stripe Connect transfer all'artigiano
        await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'RELEASED' } });
      }
    }

    await this.prisma.$transaction([
      this.prisma.dispute.update({
        where: { id: disputeId },
        data: { status: dto.resolution === 'CLIENT' ? 'RESOLVED_CLIENT' : 'RESOLVED_ARTISAN' }
      }),
      ...buildTransitionOps(
        this.prisma, dispute.requestId, dispute.request.status, targetRequestStatus,
        `Dispute resolved in favor of ${dto.resolution.toLowerCase()}`, 'dispute'
      )
    ]);
    return { ok: true };
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('disputes') disputes() { return this.service.listDisputes(); }
  @Post('disputes/:id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.service.resolveDispute(id, dto);
  }
}

@Module({
  imports: [PaymentsModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
