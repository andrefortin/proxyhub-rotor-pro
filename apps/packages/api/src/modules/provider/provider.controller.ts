import { Controller, Get, Post, Param } from '@nestjs/common';
import { ProviderService } from './provider.service';

@Controller('v1/providers')
export class ProviderController {
  constructor(private service: ProviderService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.service.findById(id);
  }

  @Post(':id/import')
  async importProxies(@Param('id') id: string) {
    return await this.service.triggerImport(id);
  }
}