import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import Redis from 'ioredis';
import { ProxyController, LeasesController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { CacheClearService } from './cache-clear.service';
import { PrismaModule } from '../../common/prisma.module';

@Module({
    imports: [PrismaModule, HttpModule],
    controllers: [ProxyController, LeasesController],
    providers: [
        ProxyService, 
        CacheClearService,
        
        {
            provide: 'REDIS',
            useFactory: () => new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
        }
    ],
    exports: [ProxyService]
})
export class ProxyModule {}
