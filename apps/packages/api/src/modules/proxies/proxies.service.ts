import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PaginatedResponse } from "../../common/pagination";
import { ProxyService as ProxyTestService } from "../proxy/proxy.service";

@Injectable()
export class ProxyService {
  constructor(
    private prisma: PrismaClient,
    @Inject(forwardRef(() => ProxyTestService)) private proxyTestService: ProxyTestService
  ) {}

  async listProxies(
    query: any,
    sample?: boolean,
    pagination?: { skip: number; take: number }
  ): Promise<PaginatedResponse<any>> {
    const {
      skip = 0,
      take = Math.min(parseInt(query?.limit || "200", 10), 5000),
    } = pagination || {};

    // Handle sorting
    let orderBy: any = { createdAt: 'desc' }; // Default fallback
    if (query.sortBy && query.sortOrder) {
      const sortField = query.sortBy;
      const sortOrder = query.sortOrder;
      
      // Map frontend field names to database field names
      const fieldMap: Record<string, string> = {
        'host': 'host',
        'pool': 'pool', 
        'country': 'country',
        'score': 'score',
        'disabled': 'disabled',
        'providerId': 'providerId',
        'lastChecked': 'lastChecked'
      };
      
      const dbField = fieldMap[sortField] || sortField;
      orderBy = { [dbField]: sortOrder };
      console.log('Sorting by:', dbField, sortOrder);
    }

    if (sample) {
      // Use raw query for random sample
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, host, pool, "providerId", country, city, region, latitude, longitude, asn, org, score FROM "Proxy" ORDER BY random() LIMIT 200`
      );
      return { items: rows, total: 200, page: 1, limit: 200 };
    }

    const where: any = {};
    const filters: any = {};
    
    // Apply filters
    if (query.pool) filters.pool = query.pool;
    if (query.providerId) filters.providerId = query.providerId;
    
    // Add search functionality
    if (query.search) {
      const searchTerm = query.search;
      const searchConditions: any[] = [
        { host: { contains: searchTerm, mode: 'insensitive' } },
        { pool: { contains: searchTerm, mode: 'insensitive' } },
        { country: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { region: { contains: searchTerm, mode: 'insensitive' } },
        { provider: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
      
      // Add port search if searchTerm is numeric
      const portNum = parseInt(searchTerm);
      if (!isNaN(portNum)) {
        searchConditions.push({ port: { equals: portNum } });
      }
      
      // Combine filters and search
      if (Object.keys(filters).length > 0) {
        where.AND = [filters, { OR: searchConditions }];
      } else {
        where.OR = searchConditions;
      }
    } else {
      // No search, just apply filters
      Object.assign(where, filters);
    }

    // Bbox filter
    if (query.bbox) {
      const parts = String(query.bbox).split(",").map(Number);
      if (parts.length === 4) {
        const bboxConditions = [
          { latitude: { gte: parts[1] } },
          { latitude: { lte: parts[3] } },
          { longitude: { gte: parts[0] } },
          { longitude: { lte: parts[2] } },
        ];
        
        if (where.AND) {
          where.AND.push(...bboxConditions);
        } else {
          where.AND = bboxConditions;
        }
      }
    }

    const total = await this.prisma.proxy.count({ where });
    console.log('Final orderBy:', orderBy);
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
        lastChecked: true,
        provider: {
          select: {
            name: true,
          },
        },
      },
      skip,
      take,
      orderBy,
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
    const importedIds: string[] = [];

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
        const created = await this.prisma.proxy.create({
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
        importedIds.push(created.id);
        imported++;
      } catch (error) {
        console.error('Failed to import proxy:', proxy, error);
        skipped++;
      }
    }

    // Test all imported proxies asynchronously after import completes
    if (importedIds.length > 0) {
      setImmediate(() => {
        console.log(`Starting tests for ${importedIds.length} imported proxies...`);
        importedIds.forEach((id, index) => {
          this.proxyTestService.testProxy(id)
            .then(() => console.log(`✓ Proxy ${index + 1}/${importedIds.length} tested successfully`))
            .catch(err => {
              console.warn(`✗ Proxy ${index + 1}/${importedIds.length} test failed, continuing...`, err.message);
            });
        });
      });
    }

    return { imported, skipped };
  }
}
