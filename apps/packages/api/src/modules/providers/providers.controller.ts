import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from "./providers.service";

@ApiTags('providers', 'mcp-tool')
@ApiBearerAuth()
@Controller("v1/providers")
export class ProvidersController {
  constructor(private service: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List all proxy providers', description: 'Get all configured proxy providers with their status and configuration' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search providers by name' })
  @ApiResponse({ status: 200, description: 'List of providers', schema: {
    properties: {
      items: { type: 'array', items: {
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['api', 'file', 'manual'] },
          active: { type: 'boolean' },
          logoUrl: { type: 'string' },
          config: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }},
      total: { type: 'number' },
      page: { type: 'number' },
      limit: { type: 'number' }
    }
  }})
  async list(@Query() q: any) {
    const { page, limit, search, mock } = q;
    return await this.service.findAll(
      { page, limit },
      search,
      mock !== undefined
    );
  }
}
