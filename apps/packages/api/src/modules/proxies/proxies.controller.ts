import { Controller, Get, Query } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Controller('v1/proxies')
export class ProxiesController {
  constructor(private prisma: PrismaClient) {}

  @Get()
  async list(@Query() q: any) {
    const limit = Math.min(parseInt(q.limit || '200', 10), 5000);
    const where: any = {};
    if (q.pool) where.pool = q.pool;
    if (q.providerId) where.providerId = q.providerId;

    // If bbox provided: [minLon,minLat,maxLon,maxLat]; we filter on lat/lon bounds
    if (q.bbox) {
      const parts = String(q.bbox).split(',').map(Number);
      if (parts.length === 4) {
        where.AND = [
          { latitude: { gte: parts[1] } },
          { latitude: { lte: parts[3] } },
          { longitude: { gte: parts[0] } },
          { longitude: { lte: parts[2] } },
        ];
      }
    }
    const rows = await this.prisma.proxy.findMany({
      where,
      select: { id: true, host: true, pool: true, providerId: true, country: true, city: true, region: true, latitude: true, longitude: true, asn: true, org: true, score: true },
      take: limit,
      orderBy: [{ score: 'desc' }, { lastChecked: 'desc' }]
    });
    return { items: rows };
  }

  // Lightweight sample for quick load
  @Get('sample')
  async sample() {
    const rows = await this.prisma.$queryRawUnsafe(`SELECT id, host, pool, "providerId", country, city, region, latitude, longitude, asn, org, score FROM "Proxy" ORDER BY random() LIMIT 200`);
    return { items: rows };
  }
}
