import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
    imports: [HttpModule],
    controllers: [ProxyController],
    providers: [
        ProxyService, 
        PrismaClient,
        {
            provide: 'REDIS',
            useFactory: () => new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
        }
    ]
})
export class ProxyModule {}
