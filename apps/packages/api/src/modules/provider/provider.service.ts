import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import {
  validatePagination,
  PaginatedResponse,
  PaginationParams,
} from "../../common/pagination";

@Injectable()
export class ProviderService {
  constructor(private prisma: PrismaClient) {}

  async getProviderById(id: string, mock?: boolean): Promise<any | null> {
    if (mock) {
      // Return a mock provider if id matches one
      const mockId = id;
      if (mockId === "mock-1") {
        return {
          id: "mock-1",
          name: "IPRoyal API",
          type: "api",
          active: true,
          config: { kind: "iproyal", access_token: "mock_token" },
          logoUrl: "https://example.com/logo.png",
        };
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
      // In real mock, add to "database" but here just return
      return { id: newId, ...data, createdAt: new Date() };
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

  async findById(id: string) {
    return this.prisma.provider.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        active: true,
        config: true,
        imports: true,
        logoUrl: true,
        proxies: true,
      },
    });
  }

  async updateProvider(
    id: string,
    data: any,
    mock?: boolean
  ): Promise<any | null> {
    if (mock) {
      // Simulate update on mock provider
      if (id === "mock-1") {
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

  async triggerImport(id: string) {
    const provider = await this.findById(id);
    if (!provider) {
      throw new Error("Provider not found");
    }

    try {
    // Insert import record
    const importRecord = await this.prisma.providerImport.create({
      data: {
        providerId: id,
        importType: provider.type,
        status: "running",
      },
    });

    /*
    // Trigger the import via service (handles API call, storage, etc.)
    const result = await this.importProxies2(id);
    return {
      success: true,
      message: "Import triggered successfully",
      imported: result.count || 0,
      provider: provider.name,
    };
    */

    // TODO: Queue actual import job for worker
    console.log(`Import queued for provider ${provider.name} (ID: ${id})`);
    return { success: true, importId: importRecord.id };
        } catch (error) {
      // Basic error handling
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /*
    async importProxies2(id: string) {
    // Basic implementation - returns mock result
    // In a real implementation, this would handle the actual import logic
    return { count: 0 };
  }
  */
}
