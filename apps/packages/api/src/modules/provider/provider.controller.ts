import {
  Controller,
  Body,
  Delete,
  Get,
  Patch,
  Post,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProviderService } from "./provider.service";

@ApiTags('providers', 'mcp-tool')
@ApiBearerAuth()
@Controller("v1/provider")
export class ProviderController {
  constructor(private service: ProviderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new proxy provider', description: 'Create a provider for API, file, or manual proxy management' })
  @ApiBody({ schema: {
    properties: {
      name: { type: 'string', description: 'Provider name' },
      type: { type: 'string', enum: ['api', 'file', 'manual'], description: 'Provider type' },
      config: { type: 'object', description: 'Provider-specific configuration' },
      logoUrl: { type: 'string', description: 'Optional logo URL' }
    },
    required: ['name', 'type', 'config']
  }})
  @ApiResponse({ status: 201, description: 'Provider created' })
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

  @Get(":id")
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Provider details' })
  async get(@Param("id") id: string) {
    return await this.service.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: 'Update provider status' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiBody({ schema: { properties: { active: { type: 'boolean' } } } })
  @ApiResponse({ status: 200, description: 'Provider updated' })
  async update(@Param("id") id: string, @Body() body: { active: boolean }) {
    return await this.service.updateProvider(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: 'Delete a provider' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Provider deleted' })
  async delete(@Param("id") id: string) {
    const success = await this.service.deleteProvider(id);
    if (!success) {
      throw new Error("Delete failed");
    }
    return { success: true, message: "Provider deleted" };
  }

  @Post(":id/import")
  @ApiOperation({ summary: 'Trigger proxy import from provider' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Import triggered' })
  async importProxies(@Param("id") id: string) {
    return await this.service.triggerImport(id);
  }
}
