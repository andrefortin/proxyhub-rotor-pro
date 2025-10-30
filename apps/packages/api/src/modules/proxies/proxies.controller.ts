import { Controller, Get, Post, Patch, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { ProxyService } from './proxies.service';
import { validatePagination, PaginationParams } from '../../common/pagination';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProxyQueryDto, CreateProxyDto, PaginatedProxiesDto } from '../../dto/proxy.dto';

@ApiTags('proxies', 'mcp-tool')
@ApiBearerAuth()
@Controller('v1/proxies')
export class ProxiesController {
  constructor(private service: ProxyService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated and filtered list of proxies' })
  @ApiQuery({ name: 'pool', required: false, type: String, description: 'Filter by pool' })
  @ApiQuery({ name: 'providerId', required: false, type: String, description: 'Filter by provider ID' })
  @ApiQuery({ name: 'bbox', required: false, type: String, description: 'Bounding box [minLon,minLat,maxLon,maxLat]' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 200, max 5000)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of items to skip (overrides page)' })
  @ApiQuery({ name: 'sample', required: false, enum: ['true'], description: 'Return random sample instead' })
  @ApiResponse({ status: 200, description: 'Paginated proxies', type: PaginatedProxiesDto })
  async list(@Query() q: ProxyQueryDto) {
    const sample = q.sample === 'true';
    if (sample) {
      const result = await this.service.listProxies(q, true);
      return result;
    }

    const params: PaginationParams = {
      page: q.page,
      limit: q.limit,
      skip: q.skip
    };
    const pagination = validatePagination(params);
    const result = await this.service.listProxies(q, false, { skip: pagination.skip, take: pagination.limit });
    return {
      ...result,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip !== undefined ? pagination.skip : undefined
    };
  }

  @Get('sample')
  @ApiOperation({ summary: 'Get random sample of 200 proxies for quick load' })
  @ApiResponse({ status: 200, description: 'Random proxies', type: PaginatedProxiesDto })
  async sample() {
    return await this.service.getSample();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new proxy' })
  @ApiBody({ type: CreateProxyDto })
  @ApiResponse({ status: 201, description: 'Created proxy', type: CreateProxyDto })
  async create(@Body() data: CreateProxyDto) {
    return await this.service.createProxy(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update proxy details' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiBody({ type: 'object', schema: { properties: { meta: { type: 'object' }, tags: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 200, description: 'Updated proxy', type: CreateProxyDto })
  async update(@Param('id') id: string, @Body() data: any) {
    return await this.service.updateProxy(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a proxy' })
  @ApiParam({ name: 'id', description: 'Proxy ID' })
  @ApiResponse({ status: 200, description: 'Deletion success', schema: { properties: { success: { type: 'boolean' } } } })
  async delete(@Param('id') id: string) {
    return await this.service.deleteProxy(id);
  }
}