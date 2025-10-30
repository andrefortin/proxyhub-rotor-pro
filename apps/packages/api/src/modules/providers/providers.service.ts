import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { validatePagination, PaginatedResponse, PaginationParams } from '../../common/pagination';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaClient) {}

  async findAll(params?: PaginationParams, search?: string, mock?: boolean): Promise<PaginatedResponse<any>> {
    const { skip, take, page, limit } = validatePagination(params);

    if (mock) {
      const mockProviders = [
        { id: 'mock-1', name: 'IPRoyal API', type: 'api', active: true, config: { kind: 'iproyal', access_token: 'mock_token' }, logoUrl: 'https://example.com/logo.png' },
        { id: 'mock-2', name: 'File Import', type: 'file', active: false, config: { path: '/path/to/proxies.txt' }, logoUrl: null },
        { id: 'mock-3', name: 'Manual Provider', type: 'manual', active: true, config: {}, logoUrl: null },
      ];
      const filteredMock = search ? mockProviders.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : mockProviders;
      const total = filteredMock.length;
      const items = filteredMock.slice(skip, skip + take);
      return { items, total, page, limit };
    }

    const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
    const total = await this.prisma.provider.count({ where });
    const items = await this.prisma.provider.findMany({
      skip,
      take,
      where,
      select: {
        id: true,
        name: true,
        type: true,
        active: true,
        config: true,
        logoUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { items, total, page, limit };
  }

  async getProviderById(id: string, mock?: boolean): Promise<any | null> {
    if (mock) {
      // Return a mock provider if id matches one
      const mockId = id;
      if (mockId === 'mock-1') {
        return { id: 'mock-1', name: 'IPRoyal API', type: 'api', active: true, config: { kind: 'iproyal', access_token: 'mock_token' }, logoUrl: 'https://example.com/logo.png' };
      }
      return null;
    }

    return this.prisma.provider.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        active: true,
        config: true,
        logoUrl: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.getProviderById(id);
  }

  async createProvider(data: any, mock?: boolean): Promise<any> {
    if (mock) {
      const newId = `mock-new-${Date.now()}`;
      const mockProvider = { id: newId, ...data, createdAt: new Date() };
      // In real mock, add to "database" but here just return
      return mockProvider;
    }

    return this.prisma.provider.create({
      data: {
        name: data.name,
        type: data.type,
        config: data.config,
        logoUrl: data.logoUrl,
      },
    });
  }

  async create(data: {
    name: string;
    type: string;
    config: any;
    logoUrl?: string;
  }) {
    return this.createProvider(data);
  }

  async updateProvider(id: string, data: any, mock?: boolean): Promise<any | null> {
    if (mock) {
      // Simulate update on mock provider
      if (id === 'mock-1') {
        const updated = { id, ...data };
        // Simulate proxy update
        return updated;
      }
      return null;
    }

    const { active } = data;
    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.update({
        where: { id },
        data: { active, ...data },
      });

      await tx.proxy.updateMany({
        where: { providerId: id },
        data: { disabled: !active },
      });

      return provider;
    });
  }

  async update(id: string, data: { active: boolean }) {
    return this.updateProvider(id, data);
  }

  async deleteProvider(id: string, mock?: boolean): Promise<boolean> {
    if (mock) {
      // Simulate deletion
      return true; // Assume success
    }

    try {
      await this.prisma.provider.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async importProxies(id: string) {
    // Basic implementation - returns mock result
    // In a real implementation, this would handle the actual import logic
    return { count: 0 };
  }
}
