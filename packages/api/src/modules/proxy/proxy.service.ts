import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Redis from 'ioredis';

function nowPlusSeconds(s: number) { return new Date(Date.now() + s * 1000); }

const LUA_RESERVE = `
if redis.call('exists', KEYS[1]) == 1 then
  return 0
else
  redis.call('set', KEYS[1], '1', 'EX', ARGV[1])
  return 1
end
`;

@Injectable()
export class ProxyService {
  private reserveSha: string | null = null;
  constructor(private prisma: PrismaClient, @Inject('REDIS') private redis: Redis) {}
  private stickyKey(project: string, pool: string) { return `sticky:${project}:${pool}`; }

  private async reserveKey(proxyId: string, ttlSec: number) {
    if (!this.reserveSha) this.reserveSha = await this.redis.script('load', LUA_RESERVE);
    const key = `proxy:inuse:${proxyId}`;
    const ok: any = await this.redis.evalsha(this.reserveSha!, 1, key, ttlSec.toString());
    return ok === 1 || ok === '1';
  }

  private formatProxy(p: any) {
    if (p.username && p.password) {
      return `${p.protocol || 'http'}://${encodeURIComponent(p.username)}:${encodeURIComponent(p.password)}@${p.host}:${p.port}`;
    }
    return `${p.protocol || 'http'}://${p.host}:${p.port}`;
  }

  async issueLease(opts: { project: string; pool: string; country?: string; sticky?: boolean }) {
    const policy = await this.prisma.poolPolicy.findUnique({ where: { pool: opts.pool } })
      .then(p => p || { reuseTtlSeconds: parseInt(process.env.DEFAULT_REUSE_TTL_SECONDS || '86400', 10), maxFailures: 5 });

    // Sticky reuse first
    if (opts.sticky) {
      const key = this.stickyKey(opts.project, opts.pool);
      const stickyProxyId = await this.redis.get(key);
      if (stickyProxyId) {
        const p = await this.prisma.proxy.findUnique({ where: { id: stickyProxyId } });
        if (p && p.failedCount < policy.maxFailures) {
          const leaseId = uuid();
          const leaseSeconds = parseInt(process.env.DEFAULT_LEASE_SECONDS || '300', 10);
          const expiresAt = nowPlusSeconds(leaseSeconds);
          await this.prisma.lease.create({ data: { id: leaseId, proxyId: p.id, project: opts.project, sticky: true, expiresAt } });
          await this.prisma.proxy.update({ where: { id: p.id }, data: { lastUsed: new Date() } });
          await this.redis.setex(key, policy.reuseTtlSeconds, p.id);
          return { leaseId, proxy: this.formatProxy(p), protocol: p.protocol, expiresAt, meta: { providerId: p.providerId, score: p.score, country: p.country, sticky: true } };
        } else {
          await this.redis.del(key);
        }
      }
    }

    // Candidate selection
    const candidates = await this.prisma.proxy.findMany({
      where: { pool: opts.pool, failedCount: { lt: policy.maxFailures } },
      orderBy: [{ score: 'desc' }, { lastChecked: 'desc' }],
      take: 30
    });

    for (const c of candidates) {
      const reserved = await this.reserveKey(c.id, policy.reuseTtlSeconds);
      if (!reserved) continue;

      const leaseId = uuid();
      const leaseSeconds = parseInt(process.env.DEFAULT_LEASE_SECONDS || '300', 10);
      const expiresAt = nowPlusSeconds(leaseSeconds);

      await this.prisma.lease.create({ data: { id: leaseId, proxyId: c.id, project: opts.project, sticky: !!opts.sticky, expiresAt } });
      await this.prisma.proxy.update({ where: { id: c.id }, data: { lastUsed: new Date() } });
      if (opts.sticky) { await this.redis.setex(this.stickyKey(opts.project, opts.pool), policy.reuseTtlSeconds, c.id); }

      return { leaseId, proxy: this.formatProxy(c), protocol: c.protocol, expiresAt, meta: { providerId: c.providerId, score: c.score, country: c.country, sticky: !!opts.sticky } };
    }
    return { error: 'NO_PROXY_AVAILABLE' };
  }

  async releaseLease(leaseId: string, body: any) {
    const lease = await this.prisma.lease.findUnique({ where: { id: leaseId } });
    if (!lease) return;
    const status = body?.status === 'ok' ? 'ok' : 'failed';
    const proxy = await this.prisma.proxy.findUnique({ where: { id: lease.proxyId } });
    await this.prisma.lease.update({ where: { id: leaseId }, data: { releasedAt: new Date(), status: status as any } });
    await this.prisma.usageEvent.create({
      data: {
        project: lease.project, pool: proxy?.pool || 'default', apiKeyId: lease.apiKeyId || null, proxyId: lease.proxyId,
        outcome: status === 'ok' ? 'success' : 'failure', latencyMs: body?.latencyMs || null, status: body?.statusCode || null, error: body?.error || null
      }
    });
    if (status !== 'ok') {
      await this.prisma.proxy.update({ where: { id: lease.proxyId }, data: { failedCount: { increment: 1 }, score: { decrement: 10 } } });
    }
  }

  async markFailed(leaseId: string, reason: string) {
    await this.releaseLease(leaseId, { status: 'failed', error: reason });
  }
}
