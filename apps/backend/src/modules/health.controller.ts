import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckError, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.pingDatabase()]);
  }

  private async pingDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch (err) {
      throw new HealthCheckError('Database check failed', { database: { status: 'down', message: (err as Error).message } });
    }
  }
}
