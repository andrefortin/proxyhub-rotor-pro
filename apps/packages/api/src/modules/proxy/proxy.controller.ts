import { Controller, Get, Query, Post, Param, Body } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller('v1/proxy')
export class ProxyController {
  constructor(private svc: ProxyService) {}
  
  @Get()
  async getProxy(@Query() q: any) {
    return this.svc.issueLease({ project: q.project, pool: q.pool || 'default', sticky: q.sticky === 'true', country: q.country });
  }
  
  @Post(':leaseId/release')
  async release(@Param('leaseId') leaseId: string, @Body() body: any) {
    await this.svc.releaseLease(leaseId, body); return { ok: true };
  }

  @Post(':leaseId/mark-failed')
  async fail(@Param('leaseId') leaseId: string, @Body() body: any) {
    await this.svc.markFailed(leaseId, body?.reason || 'unknown'); return { ok: true };
  }
}
