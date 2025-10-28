import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma.module';
import { RedisModule } from './common/redis.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { ProxiesModule } from './modules/proxies/proxies.module';

@Module({ imports: [PrismaModule, RedisModule, ProxyModule, WebhookModule, ProxiesModule] })
export class AppModule {}
