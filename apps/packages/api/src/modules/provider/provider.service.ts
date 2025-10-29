import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class ProviderService {
  constructor(private prisma: PrismaClient) {}

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

  async triggerImport(id: string) {
    const provider = await this.findById(id);
    if (!provider) {
      throw new Error("Provider not found");
    }
    // Insert import record
    const importRecord = await this.prisma.providerImport.create({
      data: {
        providerId: id,
        importType: provider.type,
        status: "running",
      },
    });
    // TODO: Queue actual import job for worker
    console.log(`Import queued for provider ${provider.name} (ID: ${id})`);
    return { success: true, importId: importRecord.id };
  }
}
