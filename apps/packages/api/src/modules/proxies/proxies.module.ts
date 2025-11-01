import { Module, forwardRef } from '@nestjs/common';
import { ProxiesController } from './proxies.controller';
import { ProxyService } from './proxies.service';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [forwardRef(() => ProxyModule)],
  controllers: [ProxiesController],
  providers: [ProxyService],
  exports: [ProxyService]
})
export class ProxiesModule {}