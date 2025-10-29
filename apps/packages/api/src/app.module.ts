import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma.module';
import { RedisModule } from './common/redis.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { ProxiesModule } from './modules/proxies/proxies.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { ProviderModule } from './modules/provider/provider.module';

@Module({
  imports: [PrismaModule, RedisModule, ProxyModule, WebhookModule, ProxiesModule, ProvidersModule, ProviderModule],
  controllers: [AppController],
 })
export class AppModule {}