import { Controller, Get, Post, Query, Body, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
      return await this.service.listProxies(q, true);
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

  @Post('import')
  @ApiOperation({ summary: 'Import proxies from CSV data' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 200, description: 'Import results', schema: { properties: { imported: { type: 'number' }, skipped: { type: 'number' } } } })
  async import(@Body() body: any) {
    const { proxies, pool, providerId } = body;
    const parsedProxies = typeof proxies === 'string' ? JSON.parse(proxies) : proxies;
    return await this.service.importProxies(parsedProxies, pool, providerId);
  }
}