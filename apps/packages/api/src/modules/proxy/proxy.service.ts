// src/services/proxy.service.ts
import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent"; // npm i https-proxy-agent
import { HttpService } from "@nestjs/axios";
import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";
import Redis from "ioredis";
import { catchError, firstValueFrom, lastValueFrom } from "rxjs";

const STATUS_CODES = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "103": "Early Hints",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a Teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Too Early",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required",
};

function nowPlusSeconds(s: number) {
  return new Date(Date.now() + s * 1000);
}

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
  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaClient,
    @Inject("REDIS") private redis: Redis
  ) {}
  private stickyKey(project: string, pool: string) {
    return `sticky:${project}:${pool}`;
  }

  private async reserveKey(proxyId: string, ttlSec: number) {
    if (!this.reserveSha)
      this.reserveSha = (await this.redis.script(
        "LOAD",
        LUA_RESERVE
      )) as string;
    const key = `proxy:inuse:${proxyId}`;
    // cSpell:ignore evalsha setex
    const ok: any = await this.redis.evalsha(
      this.reserveSha!,
      1,
      key,
      ttlSec.toString()
    );
    return ok === 1 || ok === "1";
  }

  private formatProxy(p: any) {
    if (p.username && p.password) {
      return `${p.protocol || "http"}://${encodeURIComponent(
        p.username
      )}:${encodeURIComponent(p.password)}@${p.host}:${p.port}`;
    }
    return `${p.protocol || "http"}://${p.host}:${p.port}`;
  }

  async issueLease(opts: {
    project: string;
    pool: string;
    country?: string;
    sticky?: boolean;
  }) {
    const policy = await this.prisma.poolPolicy
      .findUnique({ where: { pool: opts.pool } })
      .then(
        (p) =>
          p || {
            reuseTtlSeconds: parseInt(
              process.env.DEFAULT_REUSE_TTL_SECONDS || "86400",
              10
            ),
            maxFailures: 5,
          }
      );

    // Sticky reuse first
    if (opts.sticky) {
      const key = this.stickyKey(opts.project, opts.pool);
      const stickyProxyId = await this.redis.get(key);
      if (stickyProxyId) {
        const p = await this.prisma.proxy.findUnique({
          where: { id: stickyProxyId },
        });
        if (p && p.failedCount < policy.maxFailures) {
          const leaseId = uuid();
          const leaseSeconds = parseInt(
            process.env.DEFAULT_LEASE_SECONDS || "300",
            10
          );
          const expiresAt = nowPlusSeconds(leaseSeconds);
          await this.prisma.lease.create({
            data: {
              id: leaseId,
              proxyId: p.id,
              project: opts.project,
              sticky: true,
              expiresAt,
            },
          });
          await this.prisma.proxy.update({
            where: { id: p.id },
            data: { lastUsed: new Date() },
          });
          await this.redis.setex(key, policy.reuseTtlSeconds, p.id);
          return {
            leaseId,
            proxy: this.formatProxy(p),
            protocol: p.protocol,
            expiresAt,
            meta: {
              providerId: p.providerId,
              score: p.score,
              country: p.country,
              sticky: true,
            },
          };
        } else {
          await this.redis.del(key);
        }
      }
    }

    // Candidate selection
    const candidates = await this.prisma.proxy.findMany({
      where: { pool: opts.pool, failedCount: { lt: policy.maxFailures } },
      orderBy: [{ score: "desc" }, { lastChecked: "desc" }],
      take: 30,
    });

    for (const c of candidates) {
      const reserved = await this.reserveKey(c.id, policy.reuseTtlSeconds);
      if (!reserved) continue;

      const leaseId = uuid();
      const leaseSeconds = parseInt(
        process.env.DEFAULT_LEASE_SECONDS || "300",
        10
      );
      const expiresAt = nowPlusSeconds(leaseSeconds);

      await this.prisma.lease.create({
        data: {
          id: leaseId,
          proxyId: c.id,
          project: opts.project,
          sticky: !!opts.sticky,
          expiresAt,
        },
      });
      await this.prisma.proxy.update({
        where: { id: c.id },
        data: { lastUsed: new Date() },
      });
      if (opts.sticky) {
        await this.redis.setex(
          this.stickyKey(opts.project, opts.pool),
          policy.reuseTtlSeconds,
          c.id
        );
      }

      return {
        leaseId,
        proxy: this.formatProxy(c),
        protocol: c.protocol,
        expiresAt,
        meta: {
          providerId: c.providerId,
          score: c.score,
          country: c.country,
          sticky: !!opts.sticky,
        },
      };
    }
    return { error: "NO_PROXY_AVAILABLE" };
  }

  async releaseLease(leaseId: string, body: any) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
    });
    if (!lease) return;
    const status = body?.status === "ok" ? "ok" : "failed";
    const proxy = await this.prisma.proxy.findUnique({
      where: { id: lease.proxyId },
    });
    await this.prisma.lease.update({
      where: { id: leaseId },
      data: { releasedAt: new Date(), status: status as any },
    });
    await this.prisma.usageEvent.create({
      data: {
        project: lease.project,
        pool: proxy?.pool || "default",
        apiKeyId: lease.apiKeyId || null,
        proxyId: lease.proxyId,
        outcome: status === "ok" ? "success" : "failure",
        latencyMs: body?.latencyMs || null,
        status: body?.statusCode || null,
        error: body?.error || null,
      },
    });
    if (status !== "ok") {
      await this.prisma.proxy.update({
        where: { id: lease.proxyId },
        data: { failedCount: { increment: 1 }, score: { decrement: 10 } },
      });
    }
  }

  async markFailed(leaseId: string, reason: string) {
    await this.releaseLease(leaseId, { status: "failed", error: reason });
  }

  async updateProxy(id: string, data: any) {
    return this.prisma.proxy.update({
      where: { id },
      data,
    });
  }

  async deleteProxy(id: string) {
    // Delete related leases first to avoid foreign key constraint violation
    await this.prisma.lease.deleteMany({ where: { proxyId: id } });
    // Now delete the proxy
    await this.prisma.proxy.delete({ where: { id } });
    return { success: true };
  }

  async createProxy(data: any) {
    // Validate provider exists if providerId provided
    if (data.providerId) {
      const provider = await this.prisma.provider.findUnique({
        where: { id: data.providerId },
      });
      if (!provider) {
        throw new Error("Provider not found");
      }
    }

    return this.prisma.proxy.create({
      data: {
        pool: data.pool,
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password,
        protocol: data.protocol || "http",
        country: data.country,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        asn: data.asn,
        org: data.org,
        tags: data.tags || [],
        meta: data.meta,
        providerId: data.providerId,
      },
    });
  }

  async getProxy(id: string) {
    return this.prisma.proxy.findUnique({
      where: { id },
    });
  }

  async getTestUrl() {
    return "http://httpbin.org/ip";
  }

  async getUserAgent(os: string = "linux", device: string = "desktop") {
    if (os === "linux" && device === "desktop") {
      return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    }
    if (os === "linux" && device === "mobile") {
      return "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36";
    }
    if (os === "windows" && device === "desktop") {
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    }
    if (os === "windows" && device === "mobile") {
      return "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36";
    }
    if (os === "macos" && device === "desktop") {
      return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    }
    if (os === "macos" && device === "mobile") {
      return "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1";
    }
    if (os === "android" && device === "mobile") {
      return "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36";
    }
    if (os === "ios" && device === "mobile") {
      return "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1";
    }
    if (os === "chromeos" && device === "desktop") {
      return "Mozilla/5.0 (X11; CrOS x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    }
    if (os === "chromeos" && device === "mobile") {
      return "Mozilla/5.0 (X11; CrOS x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36";
    }
    if (os === "unknown") {
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    }
    if (device === "unknown") {
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    }
  }

  async getHeadersConfig() {
    const headersConfig: any = {
      "User-Agent": await this.getUserAgent(),
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
    };
    return headersConfig;
  }

  async testProxy(id: string): Promise<{
    success: boolean;
    httpStatus?: number;
    latencyMs?: number;
    error?: string;
  }> {
    return await this.getIpThroughProxy(id);

    /*
    const proxy = await this.prisma.proxy.findUnique({
      where: { id },
      select: {
        host: true,
        port: true,
        username: true,
        password: true,
        protocol: true,
        disabled: true,
      },
    });

    if (!proxy) return { success: false, error: "Proxy not found" };
    if (proxy.disabled) return { success: false, error: "Proxy is disabled" };

    console.log("proxy:", proxy);

    const protocol = proxy.protocol || "http";
    const auth = proxy.username
      ? { username: proxy.username, password: proxy.password || "" }
      : undefined;
    const proxyConfig = {
      protocol: "http",
      host: proxy.host,
      port: proxy.port,
      auth,
    };

    // Custom HTTPS agent to ignore TLS cert validation
    const customHttpsAgent = new HttpsAgent({
      rejectUnauthorized: false, // Disable TLS cert/hostname validation
    });

    try {
      console.log("testProxy()");
      console.log("proxyConfig:", proxyConfig);

      const start = Date.now();
      const response = await lastValueFrom(
        this.httpService.get("http://ipv4.icanhazip.com", {
          params: { format: "json" },
          httpsAgent: customHttpsAgent, // Ignore TLS errors
          proxy: proxyConfig, // Set proxy options
          timeout: 10000, // 10s timeout
        })
      );

      const latencyMs = Date.now() - start;
      const msg = {
        success: true,
        httpStatus: response.status,
        latencyMs,
      };
      console.log("msg:", msg);
      return msg;
    } catch (err: any) {
      const msg = {
        success: false,
        error: err.message || "Request failed",
        httpStatus: err.response?.status,
      };
      console.log("msg:", msg);
      return msg;
    }
      */
  }

  async getIpThroughProxy2(id: string): Promise<any> {
    const proxy = await this.prisma.proxy.findUnique({
      where: { id },
      select: {
        host: true,
        port: true,
        username: true,
        password: true,
        protocol: true,
        disabled: true,
      },
    });

    if (!proxy) return { success: false, error: "Proxy not found" };
    if (proxy.disabled) return { success: false, error: "Proxy is disabled" };

    console.log("++ proxy:", proxy);

    const proxyConfig: AxiosRequestConfig = {
      proxy: {
        host: proxy.host,
        port: proxy.port,
        auth: {
          username: proxy.username,
          password: proxy.password,
        },
      },
      url: "https://ipv4.icanhazip.com/?format=json",
      method: "GET",
      timeout: 10000, // 10s timeout
    };

    try {
      const start = Date.now();
      const response = await lastValueFrom(
        this.httpService.request(proxyConfig)
      );

      const latencyMs = Date.now() - start;
      const msg = {
        success: true,
        httpStatus: response.status,
        latencyMs,
      };
      console.log("msg:", msg);
      return msg;
    } catch (error) {
      const msg = {
        success: false,
        error: error.message || "Request failed",
        httpStatus: error.response?.status,
      };
      console.log("msg:", msg);
      return msg;
      // throw new Error(`Proxy request failed: ${error.message}`);
    }
  }

async getIpThroughProxy(id: string, useHttps = true): Promise<any> {
    const proxy = await this.prisma.proxy.findUnique({
      where: { id },
      select: {
        host: true,
        port: true,
        username: true,
        password: true,
        protocol: true,
        disabled: true,
      },
    });

    if (!proxy) return { success: false, error: "Proxy not found" };
    if (proxy.disabled) return { success: false, error: "Proxy is disabled" };


    const { host, port } = proxy;
    const username = encodeURIComponent(proxy.username) || "anonymous";
    const password = encodeURIComponent(proxy.password) || "";
    const proxyAuthString = `${username}:${password}`;
    const proxyUrl = `http://${proxyAuthString}@${host}:${port}`;
    const targetUrl = useHttps
      ? "https://ipv4.icanhazip.com/?format=json"
      : "http://ipv4.icanhazip.com/?format=json";

    const config: AxiosRequestConfig = {
      url: targetUrl,
      method: 'GET',
      headers: {
        'User-Agent': await this.getUserAgent(), // Mimic browser to avoid proxy blocks
      },
      timeout: 10000, // 10s timeout
      // Disable SSL verification temporarily (insecure; remove after testing)
      httpsAgent: useHttps ? new HttpsProxyAgent(proxyUrl) : undefined,
      proxy: useHttps ? false : { // Fallback for HTTP target
        host: host,
        port: port,
        auth: { username, password },
      }, // Disable built-in proxy for HTTPS agent
    };

    try {
      const start = Date.now();
      
      const response = await lastValueFrom(this.httpService.request(config));

      const latencyMs = Date.now() - start;
      const msg = {
        success: true,
        httpStatus: response.status,
        latencyMs,
        host: host,
        port: port,
        username,
        password,
        testUrl: targetUrl
      };
      console.log("msg:", msg);
      return msg;

    } catch (error) {
      if (useHttps && error.code === "EPROTO") {
        console.warn("HTTPS failed with SSL error, retrying with HTTP...");
        return this.getIpThroughProxy(id, false); // Retry with HTTP
      }
      throw new HttpException(
        `Proxy request failed: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }


  async testProxy2(id: string) {
    const proxy = await this.getProxy(id);
    if (!proxy) {
      throw new Error("Proxy not found");
    }

    const { protocol, host, port, username, password } = proxy;

    const configOptions = await Promise.all([
      this.getTestUrl(),
      this.getHeadersConfig(),
    ]);
    const [testUrl, headersConfig] = configOptions;

    const proxyConfig: any = {
      // protocol: 'https', // protocol || "https",
      host: host,
      port: port,
    };
    const hasCredentials = username && password;
    if (hasCredentials) {
      proxyConfig.auth = {
        username: encodeURIComponent(username),
        password: encodeURIComponent(password),
      };
    }
    const timeoutMs = 10000;

    const testUrls = [
      "https://api.ipify.org",
      //'https://ipv4.icanhazip.com',
      //'https://httpbin.org/ip',
    ];
    // If the error code >= 500 we need to try a different testUrl
    let statusCode = 500;
    let start: any = null;
    let end: any = null;
    let response: any = null;
    let url: any = null;

    for (const testUrl of testUrls) {
      url = testUrl;
      console.log("testUrl:", testUrl);
      console.log("proxyConfig:", proxyConfig);
      console.log("headersConfig:", headersConfig);
      console.log("timeoutMs:", timeoutMs);

      start = Date.now();
      response = await this.httpService.axiosRef.get<any[]>(testUrl, {
        proxy: proxyConfig,
        headers: headersConfig,
        timeout: timeoutMs,
        httpAgent: {
          rejectUnauthorized: false,
        },
      });
      end = Date.now();
      statusCode = response.status;
      if (statusCode < 500) {
        break;
      }
    }

    // return data;
    // console.log("data.status:", response.status);

    const latencyMs = end - start;
    const { status, statusText } = response;
    const body = response.data;
    const success = status >= 200 && status < 300;
    const error = success ? null : `HTTP ${status} ${statusText}`;

    return {
      success,
      latencyMs,
      proxyId: id,
      status,
      statusText,
      body,
      error,
      host,
      port,
      testUrl,
    };
  }
}
