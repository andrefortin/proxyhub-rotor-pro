import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheClearService {
  constructor(@Inject('REDIS') private redis: Redis) {}

  async clearStickySession(project: string, pool: string) {
    const key = `sticky:${project}:${pool}`;
    await this.redis.del(key);
    return { cleared: key };
  }

  async clearProxyReservation(proxyId: string) {
    const key = `proxy:inuse:${proxyId}`;
    await this.redis.del(key);
    return { cleared: key };
  }

  async clearAllSticky() {
    const keys = await this.redis.keys('sticky:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    return { cleared: keys.length };
  }

  async clearAllReservations() {
    const keys = await this.redis.keys('proxy:inuse:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    return { cleared: keys.length };
  }

  async flushAll() {
    await this.redis.flushall();
    return { message: 'All Redis cache cleared' };
  }
}