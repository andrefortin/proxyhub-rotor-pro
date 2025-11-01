import {
  Controller,
  Get,
  Query,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { ProxyService } from "./proxy.service";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  ProxyQueryDto,
  CreateProxyDto,
  PaginatedProxiesDto,
} from "../../dto/proxy.dto";

@ApiTags('proxies', 'mcp-tool')
@ApiBearerAuth()
@Controller("v1/proxy")
export class ProxyController {
  constructor(private service: ProxyService) {}

  @Get()
  @ApiOperation({ summary: 'Issue a proxy lease for use', description: 'Get a proxy for a specific project and pool. Supports sticky sessions and country filtering.' })
  @ApiQuery({ name: 'project', required: true, type: String, description: 'Project identifier for the lease' })
  @ApiQuery({ name: 'pool', required: false, type: String, description: 'Pool name (default: "default")' })
  @ApiQuery({ name: 'sticky', required: false, type: Boolean, description: 'Enable sticky session reuse' })
  @ApiQuery({ name: 'country', required: false, type: String, description: 'Filter by country code (e.g., "US")' })
  @ApiResponse({ status: 200, description: 'Proxy lease issued', schema: {
    properties: {
      leaseId: { type: 'string' },
      proxy: { type: 'string', description: 'Proxy URL with credentials' },
      protocol: { type: 'string' },
      expiresAt: { type: 'string', format: 'date-time' },
      meta: { type: 'object', properties: {
        providerId: { type: 'string' },
        score: { type: 'number' },
        country: { type: 'string' },
        sticky: { type: 'boolean' }
      }}
    }
  }})
  @ApiResponse({ status: 400, description: 'No proxy available', schema: { properties: { error: { type: 'string', example: 'NO_PROXY_AVAILABLE' } } } })
  async getProxy(@Query() q: any) {
    return this.service.issueLease({
      project: q.project,
      pool: q.pool || "default",
      sticky: q.sticky === "true",
      country: q.country,
    });
  }

  @Get(":id/test")
  @ApiOperation({ summary: 'Test a proxy connection', description: 'Test if a proxy is working and measure latency' })
  @ApiParam({ name: 'id', description: 'Proxy ID to test' })
  @ApiResponse({ status: 200, description: 'Test results', schema: {
    properties: {
      success: { type: 'boolean' },
      latencyMs: { type: 'number' },
      httpStatus: { type: 'number' },
      error: { type: 'string' }
    }
  }})
  async testProxy(@Param("id") id: string) {
    return await this.service.testProxy(id);
  }

  @Post(":leaseId/release")
  @ApiOperation({ summary: 'Release a proxy lease', description: 'Mark a lease as completed and provide usage feedback' })
  @ApiParam({ name: 'leaseId', description: 'Lease ID to release' })
  @ApiBody({ schema: {
    properties: {
      status: { type: 'string', enum: ['ok', 'failed'] },
      latencyMs: { type: 'number' },
      statusCode: { type: 'number' },
      error: { type: 'string' }
    }
  }})
  @ApiResponse({ status: 200, description: 'Lease released', schema: { properties: { ok: { type: 'boolean' } } } })
  async release(@Param("leaseId") leaseId: string, @Body() body: any) {
    await this.service.releaseLease(leaseId, body);
    return { ok: true };
  }

  @Post(":leaseId/mark-failed")
  @ApiOperation({ summary: 'Mark a proxy lease as failed', description: 'Report a failed proxy usage' })
  @ApiParam({ name: 'leaseId', description: 'Lease ID to mark as failed' })
  @ApiBody({ schema: { properties: { reason: { type: 'string', description: 'Failure reason' } } } })
  @ApiResponse({ status: 200, description: 'Lease marked as failed', schema: { properties: { ok: { type: 'boolean' } } } })
  async fail(@Param("leaseId") leaseId: string, @Body() body: any) {
    await this.service.markFailed(leaseId, body?.reason || "unknown");
    return { ok: true };
  }

  @Post()
  @ApiOperation({ summary: "Create a new proxy" })
  @ApiBody({ type: CreateProxyDto })
  @ApiResponse({
    status: 201,
    description: "Created proxy",
    type: CreateProxyDto,
  })
  async create(@Body() data: CreateProxyDto) {
    return await this.service.createProxy(data);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update proxy details" })
  @ApiParam({ name: "id", description: "Proxy ID" })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        meta: { type: "object" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Updated proxy",
    type: CreateProxyDto,
  })
  async update(@Param("id") id: string, @Body() data: any) {
    return await this.service.updateProxy(id, data);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a proxy" })
  @ApiParam({ name: "id", description: "Proxy ID" })
  @ApiResponse({
    status: 200,
    description: "Deletion success",
    schema: { properties: { success: { type: "boolean" } } },
  })
  async delete(@Param("id") id: string) {
    return await this.service.deleteProxy(id);
  }

  @Post("cache/clear")
  @ApiOperation({ summary: 'Clear proxy caches', description: 'Clear sticky sessions, reservations, or all caches' })
  @ApiQuery({ name: 'type', required: false, enum: ['sticky', 'reservations', 'all'], description: 'Cache type to clear (default: all)' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache(@Query("type") type?: 'sticky' | 'reservations' | 'all') {
    return await this.service.clearCache(type);
  }

  @Post("enrich-geoip")
  @ApiOperation({ summary: 'Bulk enrich proxies with GeoIP data' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of proxies to process (default: 100)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Force re-enrichment' })
  @ApiResponse({ status: 200, description: 'GeoIP enrichment results' })
  async enrichGeoIP(@Query("limit") limit?: number, @Query("force") force?: boolean) {
    return await this.service.enrichProxiesWithGeoIP(limit || 100, force || false);
  }
}
