import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PaginatedResponse } from "../../common/pagination";

@Injectable()
export class ProxyService {
  constructor(private prisma: PrismaClient) {}

  async listProxies(
    query: any,
    sample?: boolean,
    pagination?: { skip: number; take: number }
  ): Promise<PaginatedResponse<any>> {
    const {
      skip = 0,
      take = Math.min(parseInt(query?.limit || "200", 10), 5000),
    } = pagination || {};

    if (sample) {
      // Use raw query for random sample
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, host, pool, "providerId", country, city, region, latitude, longitude, asn, org, score FROM "Proxy" ORDER BY random() LIMIT 200`
      );
      return { items: rows, total: 200, page: 1, limit: 200 };
    }

    const where: any = {};
    if (query.pool) where.pool = query.pool;
    if (query.providerId) where.providerId = query.providerId;

    // Bbox filter
    if (query.bbox) {
      const parts = String(query.bbox).split(",").map(Number);
      if (parts.length === 4) {
        where.AND = [
          { latitude: { gte: parts[1] } },
          { latitude: { lte: parts[3] } },
          { longitude: { gte: parts[0] } },
          { longitude: { lte: parts[2] } },
        ];
      }
    }

    const total = await this.prisma.proxy.count({ where });
    const rows = await this.prisma.proxy.findMany({
      where,
      select: {
        id: true,
        host: true,
        port: true,
        username: true,
        password: true,
        protocol: true,
        pool: true,
        providerId: true,
        country: true,
        city: true,
        region: true,
        latitude: true,
        longitude: true,
        asn: true,
        org: true,
        score: true,
        tags: true,
        meta: true,
        disabled: true,
      },
      skip,
      take,
      orderBy: [{ score: "desc" }, { lastChecked: "desc" }],
    });

    const page = Math.floor(skip / take) + 1;
    const limit = take;

    return { items: rows, total, page, limit };
  }

  // Sample method - standalone if needed, but integrated into list
  async getSample() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, host, pool, "providerId", country, city, region, latitude, longitude, asn, org, score FROM "Proxy" ORDER BY random() LIMIT 200`
    );
    return { items: rows };
  }

  async importProxies(proxies: any[], pool?: string, providerId?: string): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const proxy of proxies) {
      try {
        // Check if proxy already exists (same host, port, username, password)
        const existing = await this.prisma.proxy.findFirst({
          where: {
            host: proxy.host,
            port: proxy.port || 8080,
            username: proxy.username || null,
            password: proxy.password || null,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create new proxy
        await this.prisma.proxy.create({
          data: {
            host: proxy.host,
            port: proxy.port || 8080,
            username: proxy.username || null,
            password: proxy.password || null,
            protocol: proxy.protocol || 'http',
            pool: proxy.pool || pool || 'default',
            providerId: proxy.providerId || providerId || null,
            score: 100, // Default score
            disabled: false,
          },
        });
        imported++;
      } catch (error) {
        console.error('Failed to import proxy:', proxy, error);
        skipped++;
      }
    }

    return { imported, skipped };
  }
}
