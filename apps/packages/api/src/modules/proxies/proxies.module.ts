import { Module, forwardRef } from '@nestjs/common';
import { ProxiesController } from './proxies.controller';
import { ProxyService } from './proxies.service';
import { ProxyModule } from '../proxy/proxy.module';
import { PrismaModule } from '../../common/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ProxyModule)],
  controllers: [ProxiesController],
  providers: [ProxyService],
  exports: [ProxyService]
})
export class ProxiesModule {}