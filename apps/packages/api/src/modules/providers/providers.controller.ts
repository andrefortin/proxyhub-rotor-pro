import { Controller, Get, Post, Body, Param, Query, Patch, Delete } from "@nestjs/common";
import { ProvidersService } from "./providers.service";

@Controller("v1/providers")
export class ProvidersController {
  constructor(private service: ProvidersService) {}

  @Get()
  async list(@Query() q: any) {
    // Simple list without advanced filters for now, matching original findAll
    return await this.service.findAll(); // Use service which includes logoUrl
  }

  @Post()
  async create(
    @Body()
    data: {
      name: string;
      type: "api" | "file" | "manual";
      config: any;
      logoUrl?: string;
    }
  ) {
    return await this.service.createProvider(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { active: boolean }
  ) {
    return await this.service.updateProvider(id, body);
  }

  @Post(':id/import')
  async triggerImport(@Param('id') id: string) {
    try {
      // Validate provider exists
      const provider = await this.service.findOne(id);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Trigger the import via service (handles API call, storage, etc.)
      const result = await this.service.importProxies(id);
      return {
        success: true,
        message: 'Import triggered successfully',
        imported: result.count || 0,
        provider: provider.name,
      };
    } catch (error) {
      // Basic error handling
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const success = await this.service.deleteProvider(id);
    if (!success) {
      throw new Error('Delete failed');
    }
    return { success: true, message: 'Provider deleted' };
  }
}