/** Digital CONTRACTS: created from the chosen quote + signature with a tap (timestamp). */
import {
  BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, Module,
  NotFoundException, Param, Post, UseGuards
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { CurrentUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { buildTransitionOps } from '../common/job-state-machine';

/** Currency by client country. */
export const CURRENCY: Record<string, string> = { SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD' };

export class CreateContractDto {
  @IsString() @IsNotEmpty() quoteId!: string;
}

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async createFromQuote(userId: string, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { request: { include: { client: true, contract: true } } }
    });
    if (!quote) throw new NotFoundException('QUOTE_NOT_FOUND');
    if (quote.request.clientId !== userId) throw new ForbiddenException('NOT_YOUR_REQUEST');
    if (quote.request.contract) throw new BadRequestException('CONTRACT_EXISTS');

    const [contract] = await this.prisma.$transaction([
      this.prisma.contract.create({
        data: {
          requestId: quote.requestId, clientId: userId, artisanId: quote.artisanId,
          quoteId, price: quote.price,
          currency: CURRENCY[quote.request.client.country] ?? 'AED',
          scope: quote.request.description.slice(0, 500), days: quote.days
        }
      }),
      ...buildTransitionOps(
        this.prisma, quote.requestId, quote.request.status, 'ARTISAN_SELECTED',
        'Artisan selected — contract created'
      )
    ]);
    return contract;
  }

  async getById(userId: string, id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id }, include: { artisan: true, payment: true }
    });
    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (contract.clientId !== userId) throw new ForbiddenException('NOT_YOUR_CONTRACT');
    return contract;
  }

  /** Firma con tap: timestamp server-side. In futuro: hash del documento + IP. */
  async sign(userId: string, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('CONTRACT_NOT_FOUND');
    if (contract.clientId !== userId) throw new ForbiddenException('NOT_YOUR_CONTRACT');
    if (contract.signedAt) return contract;
    return this.prisma.contract.update({ where: { id }, data: { signedAt: new Date() } });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private service: ContractsService) {}

  @Post() create(@CurrentUser() userId: string, @Body() dto: CreateContractDto) {
    return this.service.createFromQuote(userId, dto.quoteId);
  }
  @Get(':id') get(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.getById(userId, id);
  }
  @Post(':id/sign') sign(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.service.sign(userId, id);
  }
}

@Module({
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService]
})
export class ContractsModule {}
