import { Module } from '@nestjs/common';
import { ProxiesController } from './proxies.controller';
import { ProxyService } from './proxies.service';

@Module({
  controllers: [ProxiesController],
  providers: [ProxyService],
  exports: [ProxyService]
})
export class ProxiesModule {}