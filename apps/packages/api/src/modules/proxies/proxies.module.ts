import { Module } from '@nestjs/common';
import { ProxiesController } from './proxies.controller';
@Module({ controllers: [ProxiesController] })
export class ProxiesModule {}
