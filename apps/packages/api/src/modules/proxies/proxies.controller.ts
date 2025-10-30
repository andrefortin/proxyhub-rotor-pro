import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ProxyService } from './proxies.service';
import { validatePagination } from '../../common/pagination';

@Controller('v1/proxies')
export class ProxiesController {
  constructor(private service: ProxyService) {}

  @Get()
  async list(@Query() q: any) {
    const sample = q.sample === 'true';
    if (sample) {
      const result = await this.service.listProxies(q, true);
      return result;
    }

    const { page, limit, skip } = q;
    const params: PaginationParams = {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '200'),
      skip: parseInt(skip || '')
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

  // Keep separate /sample for backward compatibility
  @Get('sample')
  async sample() {
    return await this.service.getSample();
  }

  @Post()
  async create(@Body() data: any) {
    return await this.service.createProxy(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return await this.service.updateProxy(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.service.deleteProxy(id);
  }
}