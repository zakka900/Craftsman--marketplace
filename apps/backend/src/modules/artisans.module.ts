/** ARTISANS: live search, public profile (portfolio, reviews), before/after showcase. */
import { Controller, Get, Injectable, Module, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ArtisansService {
  constructor(private prisma: PrismaService) {}

  search(q: string, city?: string, categoryId?: string) {
    return this.prisma.artisan.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        ...(city && { city }),
        ...(categoryId && { categoryId })
      },
      take: 20
    });
  }

  getById(id: string) {
    return this.prisma.artisan.findUnique({
      where: { id },
      include: { portfolio: true, reviews: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
  }

  showcase() {
    // Home showcase: recent before/after jobs
    return this.prisma.portfolioItem.findMany({ take: 10, include: { artisan: true } });
  }
}

@Controller('artisans')
export class ArtisansController {
  constructor(private service: ArtisansService) {}

  @Get() search(@Query('q') q = '', @Query('city') city?: string, @Query('category') cat?: string) {
    return this.service.search(q, city, cat);
  }
  @Get('showcase') showcase() { return this.service.showcase(); }
  @Get(':id') get(@Param('id') id: string) { return this.service.getById(id); }
}

@Module({ controllers: [ArtisansController], providers: [ArtisansService] })
export class ArtisansModule {}
