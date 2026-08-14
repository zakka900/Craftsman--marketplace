/**
 * ADMIN: management dashboard (disputes, users, artisans, requests, payments,
 * reviews). Every endpoint requires @Roles('ADMIN') on top of the JWT — the same
 * RBAC pattern demonstrated by the original dispute module, extended to all domain entities.
 * No self-registration: ADMIN accounts are only created via seed
 * (prisma/seed-admin.ts), never from a public endpoint.
 */
import {
  BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException,
  Param, Post, Query, UseGuards
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

const PAGE_SIZE = 20;
function pageArgs(page?: string) {
  const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
  return { skip: (p - 1) * PAGE_SIZE, take: PAGE_SIZE, page: p };
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private payments: PaymentService) {}

  async stats() {
    const [totalUsers, totalArtisans, requestsByStatus, openDisputes, revenueByCurrency] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CLIENT' } }),
      this.prisma.artisan.count(),
      this.prisma.request.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.payment.groupBy({ by: ['currency'], where: { status: 'RELEASED' }, _sum: { amount: true } })
    ]);
    return {
      totalUsers,
      totalArtisans,
      totalRequests: requestsByStatus.reduce((sum, r) => sum + r._count._all, 0),
      requestsByStatus: Object.fromEntries(requestsByStatus.map((r) => [r.status, r._count._all])),
      openDisputes,
      revenueByCurrency: revenueByCurrency.map((r) => ({ currency: r.currency, total: r._sum.amount ?? 0 }))
    };
  }

  async users(page?: string, search?: string) {
    const { skip, take, page: p } = pageArgs(page);
    const where = {
      role: 'CLIENT' as const,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } }
            ]
          }
        : {})
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, email: true, country: true,
          emailVerified: true, bankVerified: true, createdAt: true,
          _count: { select: { requests: true } }
        }
      }),
      this.prisma.user.count({ where })
    ]);
    return { items, total, page: p, pageSize: PAGE_SIZE };
  }

  async artisans(page?: string, search?: string) {
    const { skip, take, page: p } = pageArgs(page);
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { city: { contains: search, mode: 'insensitive' as const } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.artisan.findMany({
        where,
        skip,
        take,
        orderBy: { rating: 'desc' },
        select: {
          id: true, name: true, categoryId: true, city: true, country: true,
          verified: true, rating: true, jobsDone: true,
          _count: { select: { contracts: true } }
        }
      }),
      this.prisma.artisan.count({ where })
    ]);
    return { items, total, page: p, pageSize: PAGE_SIZE };
  }

  async requests(page?: string, status?: string) {
    const { skip, take, page: p } = pageArgs(page);
    const where = status ? { status: status as any } : {};
    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          contract: { select: { price: true, currency: true, artisan: { select: { name: true } } } },
          _count: { select: { quotes: true } }
        }
      }),
      this.prisma.request.count({ where })
    ]);
    return { items, total, page: p, pageSize: PAGE_SIZE };
  }

  async requestDetail(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        client: { select: { firstName: true, lastName: true, email: true, phone: true, country: true } },
        quotes: { include: { artisan: { select: { name: true, city: true } } }, orderBy: { createdAt: 'asc' } },
        infoRequests: { include: { artisan: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
        contract: { include: { artisan: { select: { name: true } }, payment: true } },
        dispute: true,
        review: true,
        events: { orderBy: { createdAt: 'asc' } }
      }
    });
    if (!request) throw new NotFoundException('REQUEST_NOT_FOUND');
    return request;
  }

  async listPayments(page?: string, status?: string) {
    const { skip, take, page: p } = pageArgs(page);
    const where = status ? { status: status as any } : {};
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          contract: { select: { requestId: true, artisan: { select: { name: true } } } }
        }
      }),
      this.prisma.payment.count({ where })
    ]);
    return { items, total, page: p, pageSize: PAGE_SIZE };
  }

  async reviews(page?: string) {
    const { skip, take, page: p } = pageArgs(page);
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { firstName: true, lastName: true } },
          artisan: { select: { name: true } }
        }
      }),
      this.prisma.review.count()
    ]);
    return { items, total, page: p, pageSize: PAGE_SIZE };
  }

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
        // REAL PROVIDER (phase 2): Stripe Connect transfer to the artisan
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

  @Get('stats') stats() { return this.service.stats(); }

  @Get('users') users(@Query('page') page?: string, @Query('search') search?: string) {
    return this.service.users(page, search);
  }

  @Get('artisans') artisans(@Query('page') page?: string, @Query('search') search?: string) {
    return this.service.artisans(page, search);
  }

  @Get('requests') requests(@Query('page') page?: string, @Query('status') status?: string) {
    return this.service.requests(page, status);
  }

  @Get('requests/:id') requestDetail(@Param('id') id: string) {
    return this.service.requestDetail(id);
  }

  @Get('payments') payments(@Query('page') page?: string, @Query('status') status?: string) {
    return this.service.listPayments(page, status);
  }

  @Get('reviews') reviews(@Query('page') page?: string) {
    return this.service.reviews(page);
  }

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
